import { createConnection, createPool } from "mysql2/promise";
import { escapeId } from "mysql2";
import { readFile } from "node:fs/promises";
import path from "node:path";

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

if (process.env.DB_SSL?.trim().toLowerCase() !== "true") {
  throw new Error("DB_SSL=true is required to apply the TiDB Cloud schema.");
}
if (["localhost", "127.0.0.1", "::1"].includes(process.env.DB_HOST.toLowerCase())) {
  throw new Error("Local database hosts are disabled; configure the TiDB Cloud host.");
}

const port = Number(process.env.DB_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("DB_PORT must be an integer between 1 and 65535.");
}

const connectionConfig = {
  host: process.env.DB_HOST,
  port,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  charset: "utf8mb4",
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
};

let pool;
try {
  if (!/^[A-Za-z0-9_]+$/.test(process.env.DB_NAME)) {
    throw new Error("DB_NAME must contain only letters, digits, or underscores.");
  }

  const adminConnection = await createConnection(connectionConfig);
  try {
    await adminConnection.query(
      `CREATE DATABASE IF NOT EXISTS ${escapeId(process.env.DB_NAME)} ` +
        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    );
  } finally {
    await adminConnection.end();
  }

  pool = createPool({
    ...connectionConfig,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
    multipleStatements: true,
  });

  const schemaPath = path.resolve("database/schema.sql");
  const categoriesPath = path.resolve("database/seed-categories.sql");
  const schemaSql = await readFile(schemaPath, "utf8");
  const categoriesSql = await readFile(categoriesPath, "utf8");

  await pool.query(schemaSql);
  await pool.query(categoriesSql);
  console.log("Schema applied and catalog categories ensured.");
} catch (error) {
  console.error(
    "Could not apply the database schema:",
    error && typeof error === "object" && "code" in error
      ? error.code
      : error instanceof Error
        ? error.name
        : "unknown error",
  );
  process.exitCode = 1;
} finally {
  await pool?.end();
}
