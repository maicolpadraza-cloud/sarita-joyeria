import { spawnSync } from "node:child_process";
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
  throw new Error("DB_SSL=true is required to migrate TiDB.");
}

const host = process.env.DB_HOST.trim();
if (["localhost", "127.0.0.1", "::1"].includes(host.toLowerCase())) {
  throw new Error("Local database hosts are disabled for this migration.");
}

const port = Number(process.env.DB_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("DB_PORT must be an integer between 1 and 65535.");
}

const materials = [
  "Xuping",
  "Magold",
  "Folheado",
  "Folleado",
  "Foliado",
  "Acero",
  "Titanio",
  "Artesanal",
  "Cuero sintético",
];
const supportedMaterials = materials.filter(
  (material) => material !== "Folleado" && material !== "Foliado",
);
const quote = (value) => `'${value.replaceAll("'", "''")}'`;
const enumDefinition = (values) =>
  `ENUM(${values.map(quote).join(", ")}) NOT NULL`;

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

const materialTables = [
  "products",
  "category_material_rules",
  "subcategory_material_rules",
  "accessory_material_rules",
];
const productForeignKeys = [
  "fk_products_category_material",
  "fk_products_subcategory_material",
  "fk_products_accessory_material",
];

function normalizeEnum(value) {
  return value.toLowerCase().replaceAll(" ", "").replaceAll("`", "");
}

async function ensureMaterialEnum(table, values) {
  const [[column]] = await connection.execute(
    `SELECT COLUMN_TYPE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = 'material'
     LIMIT 1`,
    [table],
  );
  if (!column) {
    throw new Error(`The ${table}.material column does not exist.`);
  }

  const expected = normalizeEnum(
    `enum(${values.map((value) => quote(value)).join(",")})`,
  );
  if (normalizeEnum(column.COLUMN_TYPE) !== expected) {
    await connection.query(
      `ALTER TABLE \`${table}\`
       MODIFY COLUMN material ${enumDefinition(values)}`,
    );
  }
}

async function dropProductMaterialForeignKeys() {
  for (const name of productForeignKeys) {
    const [rows] = await connection.execute(
      `SELECT CONSTRAINT_NAME
       FROM information_schema.TABLE_CONSTRAINTS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'products'
         AND CONSTRAINT_TYPE = 'FOREIGN KEY'
         AND CONSTRAINT_NAME = ?
       LIMIT 1`,
      [name],
    );
    if (rows.length > 0) {
      await connection.query(
        `ALTER TABLE products DROP FOREIGN KEY \`${name}\``,
      );
    }
  }
}

async function rebuildRuleTable(table, columns) {
  const [[column]] = await connection.execute(
    `SELECT COLUMN_TYPE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = 'material'
     LIMIT 1`,
    [table],
  );
  if (!column) {
    throw new Error(`The ${table}.material column does not exist.`);
  }
  const expected = normalizeEnum(
    `enum(${supportedMaterials.map((value) => quote(value)).join(",")})`,
  );
  if (normalizeEnum(column.COLUMN_TYPE) === expected) return;

  const [rows] = await connection.query(
    `SELECT ${[...columns, "material", "legacy_exception"].join(", ")}
     FROM \`${table}\``,
  );
  const nextTable = `${table}_next`;
  const oldTable = `${table}_old`;
  await connection.query(`DROP TABLE IF EXISTS \`${nextTable}\``);

  const columnDefinitions = [
    "category_id INT UNSIGNED NOT NULL",
    ...(columns.includes("subcategory")
      ? ["subcategory VARCHAR(32) NOT NULL"]
      : []),
    ...(columns.includes("accessory_type")
      ? ["accessory_type VARCHAR(32) NOT NULL"]
      : []),
    `material ${enumDefinition(supportedMaterials)}`,
    "legacy_exception TINYINT(1) NOT NULL DEFAULT 0",
    `PRIMARY KEY (${[...columns, "material"].join(", ")})`,
  ];
  await connection.query(
    `CREATE TABLE \`${nextTable}\` (
       ${columnDefinitions.join(",\n       ")}
     ) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  const insertColumns = [...columns, "material", "legacy_exception"];
  const placeholders = insertColumns.map(() => "?").join(", ");
  for (const row of rows) {
    const material =
      row.material === "Folleado" || row.material === "Foliado"
        ? "Folheado"
        : row.material;
    await connection.execute(
      `INSERT INTO \`${nextTable}\` (${insertColumns.join(", ")})
       VALUES (${placeholders})
       ON DUPLICATE KEY UPDATE
         legacy_exception = GREATEST(legacy_exception, VALUES(legacy_exception))`,
      [
        ...columns.map((columnName) => row[columnName]),
        material,
        row.legacy_exception,
      ],
    );
  }

  await connection.query(`DROP TABLE IF EXISTS \`${oldTable}\``);
  await connection.query(
    `RENAME TABLE \`${table}\` TO \`${oldTable}\`,
                 \`${nextTable}\` TO \`${table}\``,
  );
  await connection.query(`DROP TABLE \`${oldTable}\``);
  await connection.query(
    `ALTER TABLE \`${table}\`
     ADD CONSTRAINT \`fk_${table}_category\`
     FOREIGN KEY (category_id) REFERENCES categories (id)
     ON UPDATE CASCADE ON DELETE CASCADE`,
  );
}

let movedCodes = [];
let initialProductCount = 0;
let migrationSucceeded = false;
try {
  const [tables] = await connection.execute(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME IN (
         'categories',
         'products',
         'category_material_rules',
         'subcategory_material_rules',
         'accessory_material_rules'
       )`,
  );
  const existingTables = new Set(tables.map((row) => row.TABLE_NAME));
  const missingTables = [
    "categories",
    ...materialTables,
    "category_material_rules",
    "subcategory_material_rules",
    "accessory_material_rules",
  ].filter(
    (table, index, list) =>
      list.indexOf(table) === index && !existingTables.has(table),
  );
  if (missingTables.length > 0) {
    throw new Error(`Missing database tables: ${missingTables.join(", ")}`);
  }

  const [[{ count }]] = await connection.execute(
    "SELECT COUNT(*) AS count FROM products",
  );
  initialProductCount = Number(count);

  const [[piercings]] = await connection.execute(
    "SELECT id FROM categories WHERE name = 'Piercings' LIMIT 1",
  );
  const [[titanium]] = await connection.execute(
    "SELECT id FROM categories WHERE name = 'Titanio' LIMIT 1",
  );
  if (!piercings) {
    throw new Error("The Piercings category does not exist in the database.");
  }

  await dropProductMaterialForeignKeys();
  await ensureMaterialEnum("products", materials);
  await rebuildRuleTable("category_material_rules", ["category_id"]);
  await rebuildRuleTable("subcategory_material_rules", [
    "category_id",
    "subcategory",
  ]);
  await rebuildRuleTable("accessory_material_rules", [
    "category_id",
    "accessory_type",
  ]);

  const moveConditions = [];
  const moveParameters = [Number(piercings.id)];
  if (titanium) {
    moveConditions.push("category_id = ?");
    moveParameters.push(Number(titanium.id));
  }
  moveConditions.push("subcategory = 'Titanio'");
  const [productsToMove] = await connection.execute(
    `SELECT id, code
     FROM products
     WHERE ${moveConditions.join(" OR ")}`,
    moveParameters.slice(1),
  );
  movedCodes = productsToMove.map((product) => product.code);

  if (productsToMove.length > 0) {
    const ids = productsToMove.map((product) => product.id);
    const placeholders = ids.map(() => "?").join(", ");
    await connection.execute(
      `UPDATE products
       SET category_id = ?,
           subcategory = NULL,
           material = 'Titanio'
       WHERE id IN (${placeholders})`,
      [Number(piercings.id), ...ids],
    );
  }

  await connection.query(
    "UPDATE products SET material = 'Folheado' WHERE material IN ('Folleado', 'Foliado')",
  );

  await ensureMaterialEnum("products", supportedMaterials);

  if (titanium) {
    await connection.execute(
      "DELETE FROM categories WHERE id = ? AND name = 'Titanio'",
      [Number(titanium.id)],
    );
  }

  const [[remainingTitaniumCategory]] = await connection.execute(
    "SELECT COUNT(*) AS count FROM categories WHERE name = 'Titanio'",
  );
  const [[remainingTitaniumSubcategory]] = await connection.execute(
    "SELECT COUNT(*) AS count FROM products WHERE subcategory = 'Titanio'",
  );
  if (
    Number(remainingTitaniumCategory.count) !== 0 ||
    Number(remainingTitaniumSubcategory.count) !== 0
  ) {
    throw new Error("Titanio category or subcategory data remains.");
  }

  const [[finalProductCount]] = await connection.execute(
    "SELECT COUNT(*) AS count FROM products",
  );
  if (Number(finalProductCount.count) !== initialProductCount) {
    throw new Error("The migration changed the number of products.");
  }
  migrationSucceeded = true;
} catch (error) {
  console.error(
    "Titanium migration failed:",
    error && typeof error === "object" && "code" in error
      ? error.code
      : "unknown error",
    error instanceof Error ? error.message : "unknown error",
  );
  process.exitCode = 1;
} finally {
  await connection.end();
}

if (process.exitCode !== 1) {
  const result = spawnSync(
    process.execPath,
    ["scripts/migrate-material-rules.mjs"],
    { env: process.env, stdio: "inherit" },
  );
  if (result.error) {
    console.error("Could not run the material rules migration.");
    process.exitCode = 1;
  } else if (result.status !== 0) {
    console.error("The material rules migration did not complete.");
    process.exitCode = result.status ?? 1;
    migrationSucceeded = false;
  }
}

if (migrationSucceeded && process.exitCode !== 1) {
  console.log(
    `Titanio category removed; moved product codes: ${movedCodes.length ? movedCodes.join(", ") : "none"}.`,
  );
  console.log(`Product count preserved: ${initialProductCount}.`);
}
