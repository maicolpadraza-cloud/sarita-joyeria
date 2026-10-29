import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import {
  ProductValidationError,
  isAllowedProductImageUrl,
  validateProductInput,
} from "@/lib/product-validation";
import type { AdminProduct, Product } from "@/lib/products";

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
  imageKitFileId: string | null;
  description: string;
  inStock: number;
}

interface CategoryIdRow extends RowDataPacket {
  id: number;
}

function mapProductRow(row: ProductRow, includeImageKitFileId = false): AdminProduct {
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
      image: isAllowedProductImageUrl(row.image)
        ? row.image
        : "/logo-luna.png",
      ...(includeImageKitFileId && row.imageKitFileId
        ? { imageKitFileId: row.imageKitFileId }
        : {}),
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
    `SELECT
      p.id,
      p.name,
      c.name AS category,
      p.subcategory,
      p.accessory_type AS accessoryType,
      p.material,
      p.closure_type AS closureType,
      p.price,
      p.image,
      p.imagekit_file_id AS imageKitFileId,
      p.description,
      p.in_stock AS inStock
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     ORDER BY p.created_at DESC, p.id ASC`,
  );
  return rows.map((row) => mapProductRow(row));
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const [rows] = await db.execute<ProductRow[]>(
    `SELECT
      p.id,
      p.name,
      c.name AS category,
      p.subcategory,
      p.accessory_type AS accessoryType,
      p.material,
      p.closure_type AS closureType,
      p.price,
      p.image,
      p.imagekit_file_id AS imageKitFileId,
      p.description,
      p.in_stock AS inStock
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     ORDER BY p.created_at DESC, p.id ASC`,
  );
  return rows.map((row) => mapProductRow(row, true));
}

export async function getProductById(id: string): Promise<Product | null> {
  const [rows] = await db.execute<ProductRow[]>(
    `SELECT
      p.id,
      p.name,
      c.name AS category,
      p.subcategory,
      p.accessory_type AS accessoryType,
      p.material,
      p.closure_type AS closureType,
      p.price,
      p.image,
      p.imagekit_file_id AS imageKitFileId,
      p.description,
      p.in_stock AS inStock
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     WHERE p.id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ? mapProductRow(rows[0]) : null;
}

export async function getImageKitFileId(id: string): Promise<string | null> {
  const [rows] = await db.execute<Array<RowDataPacket & { imageKitFileId: string | null }>>(
    "SELECT imagekit_file_id AS imageKitFileId FROM products WHERE id = ? LIMIT 1",
    [id],
  );
  return rows[0]?.imageKitFileId ?? null;
}

export async function isImageKitFileInUse(fileId: string): Promise<boolean> {
  const [rows] = await db.execute<Array<RowDataPacket & { id: string }>>(
    "SELECT id FROM products WHERE imagekit_file_id = ? LIMIT 1",
    [fileId],
  );
  return rows.length > 0;
}

export async function createProduct(product: AdminProduct): Promise<Product> {
  const categoryId = await getCategoryId(product.category);
  await db.execute<ResultSetHeader>(
    `INSERT INTO products
      (id, name, category_id, subcategory, accessory_type, material,
       closure_type, price, image, imagekit_file_id, description, in_stock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      product.imageKitFileId ?? null,
      product.description,
      product.inStock ? 1 : 0,
    ],
  );

  return product;
}

export async function updateProduct(
  id: string,
  product: AdminProduct,
): Promise<Product | null> {
  const categoryId = await getCategoryId(product.category);
  await db.execute<ResultSetHeader>(
    `UPDATE products
     SET name = ?, category_id = ?, subcategory = ?, accessory_type = ?,
         material = ?, closure_type = ?, price = ?, image = ?,
         imagekit_file_id = ?,
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
      product.imageKitFileId ?? null,
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
