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
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'products'
       AND COLUMN_NAME = 'imagekit_file_id'
     LIMIT 1`,
  );
  if (columns.length === 0) {
    await connection.query(
      "ALTER TABLE products ADD COLUMN imagekit_file_id VARCHAR(128) NULL",
    );
    console.log("Added products.imagekit_file_id.");
  } else {
    console.log("products.imagekit_file_id already exists.");
  }

  const [indexes] = await connection.execute(
    `SELECT INDEX_NAME
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'products'
       AND INDEX_NAME = 'idx_products_imagekit_file_id'
     LIMIT 1`,
  );
  if (indexes.length === 0) {
    await connection.query(
      "ALTER TABLE products ADD INDEX idx_products_imagekit_file_id (imagekit_file_id)",
    );
    console.log("Added idx_products_imagekit_file_id.");
  } else {
    console.log("idx_products_imagekit_file_id already exists.");
  }
} catch (error) {
  console.error(
    "ImageKit database migration failed:",
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
