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
  throw new Error("DB_SSL=true is required to migrate wallet material rules.");
}

const host = process.env.DB_HOST.trim();
if (["localhost", "127.0.0.1", "::1"].includes(host.toLowerCase())) {
  throw new Error("Local database hosts are disabled for this migration.");
}

const port = Number(process.env.DB_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("DB_PORT must be an integer between 1 and 65535.");
}

const allowedMaterial = "Cuero sintético";
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
  const [categoryRows] = await connection.execute(
    "SELECT id FROM categories WHERE name = ? LIMIT 1",
    ["Varones"],
  );
  const categoryId = categoryRows[0]?.id;
  if (categoryId === undefined) {
    throw new Error("The Varones category does not exist.");
  }

  const [ruleTableRows] = await connection.execute(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'accessory_material_rules'
     LIMIT 1`,
  );
  if (ruleTableRows.length === 0) {
    throw new Error("The accessory_material_rules table does not exist.");
  }

  const [[{ productCount: productCountBefore }]] =
    await connection.execute("SELECT COUNT(*) AS productCount FROM products");
  const [violatingProducts] = await connection.execute(
    `SELECT code
     FROM products
     WHERE category_id = ?
       AND accessory_type = 'Billeteras'
       AND material <> ?
     ORDER BY code`,
    [categoryId, allowedMaterial],
  );

  const [existingRules] = await connection.execute(
    `SELECT material
     FROM accessory_material_rules
     WHERE category_id = ?
       AND accessory_type = 'Billeteras'`,
    [categoryId],
  );

  await connection.execute(
    `INSERT INTO accessory_material_rules
       (category_id, accessory_type, material, legacy_exception)
     VALUES (?, 'Billeteras', ?, 0)
     ON DUPLICATE KEY UPDATE legacy_exception = 0`,
    [categoryId, allowedMaterial],
  );

  for (const { material } of existingRules) {
    if (material === allowedMaterial) continue;

    const [[{ productCount }]] = await connection.execute(
      `SELECT COUNT(*) AS productCount
       FROM products
       WHERE category_id = ?
         AND accessory_type = 'Billeteras'
         AND material = ?`,
      [categoryId, material],
    );

    if (Number(productCount) > 0) {
      await connection.execute(
        `UPDATE accessory_material_rules
         SET legacy_exception = 1
         WHERE category_id = ?
           AND accessory_type = 'Billeteras'
           AND material = ?`,
        [categoryId, material],
      );
    } else {
      await connection.execute(
        `DELETE FROM accessory_material_rules
         WHERE category_id = ?
           AND accessory_type = 'Billeteras'
           AND material = ?`,
        [categoryId, material],
      );
    }
  }

  const [finalRules] = await connection.execute(
    `SELECT material, legacy_exception AS legacyException
     FROM accessory_material_rules
     WHERE category_id = ?
       AND accessory_type = 'Billeteras'
     ORDER BY material`,
    [categoryId],
  );
  const activeRules = finalRules.filter(
    (rule) => Number(rule.legacyException) === 0,
  );
  if (
    activeRules.length !== 1 ||
    activeRules[0].material !== allowedMaterial
  ) {
    throw new Error("The active Varones/Billeteras rule did not synchronize.");
  }

  const [[{ productCount: productCountAfter }]] =
    await connection.execute("SELECT COUNT(*) AS productCount FROM products");
  if (Number(productCountBefore) !== Number(productCountAfter)) {
    throw new Error("The product count changed during the rule migration.");
  }

  console.log("Varones/Billeteras now allows only Cuero sintético.");
  console.log(
    `Preserved ${violatingProducts.length} existing product(s) without modifying them.`,
  );
  if (violatingProducts.length > 0) {
    console.log(
      `Legacy product codes: ${violatingProducts
        .map((product) => product.code)
        .join(", ")}`,
    );
  }
  console.log(`Product count unchanged: ${productCountAfter}.`);
} catch (error) {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : "MIGRATION_ERROR";
  console.error(`Wallet material migration failed (${code}).`);
  process.exitCode = 1;
} finally {
  await connection.end();
}
