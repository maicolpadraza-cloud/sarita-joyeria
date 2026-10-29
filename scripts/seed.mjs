import { createPool } from "mysql2/promise";
import ts from "typescript";
import { readFile } from "node:fs/promises";
import { createRequire, Module } from "node:module";
import path from "node:path";

const productsPath = path.resolve("src/lib/products.ts");
const productsSource = await readFile(productsPath, "utf8");
const compiledProducts = ts.transpileModule(productsSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const productsModule = new Module(productsPath);
productsModule.filename = productsPath;
productsModule.paths = Module._nodeModulePaths(process.cwd());
productsModule.require = createRequire(productsPath);
productsModule._compile(compiledProducts, productsPath);
const { products } = productsModule.exports;

const requiredVariables = [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "DB_SSL",
];
const missingVariables = requiredVariables.filter(
  (name) => !process.env[name]?.trim(),
);
if (missingVariables.length > 0) {
  throw new Error(`Missing database configuration: ${missingVariables.join(", ")}`);
}

if (["localhost", "127.0.0.1", "::1"].includes(process.env.DB_HOST.toLowerCase())) {
  throw new Error("Local database hosts are disabled; configure the TiDB Cloud host.");
}
if (process.env.DB_SSL?.trim().toLowerCase() !== "true") {
  throw new Error("DB_SSL=true is required for TiDB Cloud connections.");
}

const port = Number(process.env.DB_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("DB_PORT must be an integer between 1 and 65535.");
}

const pool = createPool({
  host: process.env.DB_HOST,
  port,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0,
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
});

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

let connection;
try {
  connection = await pool.getConnection();
  await connection.beginTransaction();

  const [categoryRows] = await connection.query(
    "SELECT id, name FROM categories",
  );
  const categoryIds = new Map(
    categoryRows.map((category) => [category.name, category.id]),
  );

  for (const product of products) {
    const categoryId = categoryIds.get(product.category);
    if (categoryId === undefined) {
      throw new Error(`Missing seeded category: ${product.category}`);
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
  console.log(`Seeded ${products.length} catalog products.`);
} catch (error) {
  if (connection) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error("Could not roll back seed transaction:", rollbackError);
    }
  }
  console.error(
    "Catalog seed failed:",
    error && typeof error === "object" && "code" in error
      ? error.code
      : error instanceof Error
        ? error.name
        : "unknown error",
  );
  process.exitCode = 1;
} finally {
  connection?.release();
  await pool.end();
}
