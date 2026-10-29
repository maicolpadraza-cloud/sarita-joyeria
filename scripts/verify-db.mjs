import { createPool } from "mysql2/promise";

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
  throw new Error("DB_SSL=true is required to verify the TiDB Cloud database.");
}
if (["localhost", "127.0.0.1", "::1"].includes(process.env.DB_HOST.toLowerCase())) {
  throw new Error("Local database hosts are disabled; configure the TiDB Cloud host.");
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
  connectionLimit: 1,
  queueLimit: 0,
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
});

try {
  const [rows] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM categories) AS category_count,
      (SELECT COUNT(*) FROM products) AS product_count
  `);
  const [counts] = rows;
  console.log(
    `Database counts: ${counts.category_count} categories, ${counts.product_count} products.`,
  );
} catch (error) {
  console.error(
    "Could not verify database counts:",
    error && typeof error === "object" && "code" in error
      ? error.code
      : error instanceof Error
        ? error.name
        : "unknown error",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
