import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import {
  ProductValidationError,
  validateProductInput,
} from "@/lib/product-validation";
import type { Product } from "@/lib/products";

interface ProductRow extends RowDataPacket {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  accessoryType: string | null;
  material: string;
  closureType: string | null;
  price: number | string;
  image: string;
  description: string;
  inStock: number;
}

interface CategoryIdRow extends RowDataPacket {
  id: number;
}

const productSelect = `
  SELECT
    p.id,
    p.name,
    c.name AS category,
    p.subcategory,
    p.accessory_type AS accessoryType,
    p.material,
    p.closure_type AS closureType,
    p.price,
    p.image,
    p.description,
    p.in_stock AS inStock
  FROM products p
  INNER JOIN categories c ON c.id = p.category_id
`;

function mapProductRow(row: ProductRow): Product {
  return validateProductInput(
    {
      id: row.id,
      name: row.name,
      category: row.category,
      subcategory: row.subcategory ?? undefined,
      accessoryType: row.accessoryType ?? undefined,
      material: row.material,
      closureType: row.closureType ?? undefined,
      price: Number(row.price),
      image: row.image,
      description: row.description,
      inStock: Boolean(row.inStock),
    },
    { requireId: true },
  );
}

async function getCategoryId(category: string): Promise<number> {
  const [rows] = await db.execute<CategoryIdRow[]>(
    "SELECT id FROM categories WHERE name = ? LIMIT 1",
    [category],
  );

  if (!rows[0]) {
    throw new ProductValidationError(
      "La categoría seleccionada no existe en la base de datos.",
    );
  }

  return rows[0].id;
}

export async function getAllProducts(): Promise<Product[]> {
  const [rows] = await db.execute<ProductRow[]>(
    `${productSelect} ORDER BY p.created_at DESC, p.id ASC`,
  );
  return rows.map(mapProductRow);
}

export async function getProductById(id: string): Promise<Product | null> {
  const [rows] = await db.execute<ProductRow[]>(
    `${productSelect} WHERE p.id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ? mapProductRow(rows[0]) : null;
}

export async function createProduct(product: Product): Promise<Product> {
  const categoryId = await getCategoryId(product.category);
  await db.execute<ResultSetHeader>(
    `INSERT INTO products
      (id, name, category_id, subcategory, accessory_type, material,
       closure_type, price, image, description, in_stock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
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
    ],
  );

  return product;
}

export async function updateProduct(
  id: string,
  product: Product,
): Promise<Product | null> {
  const categoryId = await getCategoryId(product.category);
  await db.execute<ResultSetHeader>(
    `UPDATE products
     SET name = ?, category_id = ?, subcategory = ?, accessory_type = ?,
         material = ?, closure_type = ?, price = ?, image = ?,
         description = ?, in_stock = ?
     WHERE id = ?`,
    [
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
      id,
    ],
  );

  return getProductById(id);
}

export async function deleteProduct(id: string): Promise<boolean> {
  const [result] = await db.execute<ResultSetHeader>(
    "DELETE FROM products WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
}
