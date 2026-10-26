import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";
import { products } from "@/lib/products";

interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
}

const upsertProductSql = `
  INSERT INTO products
    (id, name, category_id, subcategory, accessory_type, material,
     closure_type, price, image, description, in_stock)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    category_id = VALUES(category_id),
    subcategory = VALUES(subcategory),
    accessory_type = VALUES(accessory_type),
    material = VALUES(material),
    closure_type = VALUES(closure_type),
    price = VALUES(price),
    image = VALUES(image),
    description = VALUES(description),
    in_stock = VALUES(in_stock)
`;

// TODO: Remove this temporary seed route after the initial data load.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "La carga inicial está deshabilitada en producción." },
      { status: 403 },
    );
  }

  let connection: PoolConnection | undefined;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [categories] = await connection.query<CategoryRow[]>(
      "SELECT id, name FROM categories",
    );
    const categoryIds = new Map(
      categories.map((category) => [category.name, category.id]),
    );

    for (const product of products) {
      const categoryId = categoryIds.get(product.category);
      if (categoryId === undefined) {
        throw new Error(
          `No existe la categoría "${product.category}" en la base de datos.`,
        );
      }

      await connection.execute(upsertProductSql, [
        product.id,
        product.name,
        categoryId,
        product.subcategory ?? null,
        product.accessoryType ?? null,
        product.material,
        product.closureType ?? null,
        product.price,
        product.image,
        product.description,
        product.inStock ? 1 : 0,
      ]);
    }

    await connection.commit();
    return Response.json({ ok: true, seeded: products.length });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("No se pudo revertir la transacción de seed:", rollbackError);
      }
    }

    console.error("Error al cargar los productos de muestra:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cargar la muestra de productos.",
      },
      { status: 500 },
    );
  } finally {
    connection?.release();
  }
}
