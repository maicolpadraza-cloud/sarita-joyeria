import { createConnection } from "mysql2/promise";

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
  throw new Error(
    `Missing database configuration: ${missingVariables.join(", ")}`,
  );
}
if (process.env.DB_SSL.trim().toLowerCase() !== "true") {
  throw new Error("DB_SSL=true is required to migrate the TiDB Cloud database.");
}

const host = process.env.DB_HOST.trim();
if (["localhost", "127.0.0.1", "::1"].includes(host.toLowerCase())) {
  throw new Error("Local database hosts are disabled for this migration.");
}

const port = Number(process.env.DB_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("DB_PORT must be an integer between 1 and 65535.");
}

const connection = await createConnection({
  host,
  port,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4",
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  connectTimeout: 15_000,
});

try {
  const [columns] = await connection.execute(
    `SELECT COLUMN_NAME, IS_NULLABLE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'products'
       AND COLUMN_NAME = 'code'
     LIMIT 1`,
  );
  const needsNotNull = columns.length === 0 || columns[0].IS_NULLABLE === "YES";

  if (columns.length === 0) {
    await connection.query(
      "ALTER TABLE products ADD COLUMN code VARCHAR(20) NULL",
    );
    console.log("Added products.code.");
  }

  const [products] = await connection.execute(
    "SELECT id, code FROM products ORDER BY created_at ASC, id ASC",
  );
  let nextNumber = products.reduce((maximum, product) => {
    const match =
      typeof product.code === "string" && /^SJ-(\d{4,})$/.exec(product.code);
    if (!match) return maximum;
    const parsed = Number(match[1]);
    return Number.isSafeInteger(parsed) ? Math.max(maximum, parsed) : maximum;
  }, 0);

  await connection.beginTransaction();
  try {
    for (const product of products) {
      if (product.code !== null) continue;

      nextNumber++;
      const code = `SJ-${String(nextNumber).padStart(4, "0")}`;
      if (code.length > 20) {
        throw new Error("Product code sequence exceeds the VARCHAR(20) limit.");
      }
      await connection.execute(
        "UPDATE products SET code = ? WHERE id = ? AND code IS NULL",
        [code, product.id],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  }

  const [unassigned] = await connection.execute(
    "SELECT COUNT(*) AS remaining FROM products WHERE code IS NULL",
  );
  if (Number(unassigned[0].remaining) !== 0) {
    throw new Error("Some products could not be assigned a product code.");
  }

  if (needsNotNull) {
    await connection.query(
      "ALTER TABLE products MODIFY COLUMN code VARCHAR(20) NOT NULL",
    );
    console.log("Made products.code NOT NULL.");
  }

  const [indexes] = await connection.execute(
    `SELECT INDEX_NAME
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'products'
       AND INDEX_NAME = 'uq_products_code'
     LIMIT 1`,
  );
  if (indexes.length === 0) {
    await connection.query(
      "ALTER TABLE products ADD UNIQUE INDEX uq_products_code (code)",
    );
    console.log("Added unique index uq_products_code.");
  } else {
    console.log("Unique index uq_products_code already exists.");
  }

  console.log(`Assigned product codes to ${products.length} existing products.`);
} catch (error) {
  console.error(
    "Product code migration failed:",
    error && typeof error === "object" && "code" in error
      ? error.code
      : error instanceof Error
        ? error.name
        : "unknown error",
  );
  process.exitCode = 1;
} finally {
  await connection.end();
}
