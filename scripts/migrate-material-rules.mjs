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
  throw new Error("DB_SSL=true is required to migrate TiDB material rules.");
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
  "Acero",
  "Titanio",
  "Artesanal",
  "Cuero sintético",
];
const materialsByCategory = {
  Aritos: ["Artesanal", "Folheado", "Acero", "Magold", "Xuping"],
  Argollas: ["Artesanal", "Folheado", "Acero", "Magold", "Xuping"],
  Collares: ["Artesanal", "Acero", "Magold", "Xuping"],
  Dijes: ["Artesanal", "Acero", "Magold", "Xuping"],
  Rosarios: ["Acero", "Xuping"],
  Anillos: ["Acero", "Magold", "Xuping"],
  Pulseras: ["Acero", "Magold", "Xuping"],
  Piercings: ["Folheado", "Titanio", "Acero"],
  Conjuntos: ["Acero", "Xuping", "Magold"],
  Relojes: ["Acero"],
  Carteras: ["Cuero sintético"],
  Billeteras: ["Cuero sintético"],
  "Mini joyeros": ["Artesanal"],
  Varones: ["Acero", "Xuping", "Magold", "Folheado", "Cuero sintético"],
  Tobilleras: ["Xuping", "Acero"],
};
const masculineWalletMaterials = [
  "Xuping",
  "Magold",
  "Folheado",
  "Cuero sintético",
];
const categories = Object.keys(materialsByCategory);

function ruleKey(rule, columns) {
  return columns.map((column) => String(rule[column])).join("\u0000");
}

function isMaterialAllowed(product) {
  if (product.category === "Dijes") {
    if (product.subcategory === null) {
      return materialsByCategory.Dijes.includes(product.material);
    }
    return (
      product.subcategory === "Iniciales" &&
      ["Xuping", "Acero"].includes(product.material)
    );
  }
  if (product.category === "Varones") {
    if (["Cadenas", "Pulseras", "Anillos"].includes(product.accessoryType)) {
      return product.material === "Acero";
    }
    return (
      product.accessoryType === "Billeteras" &&
      masculineWalletMaterials.includes(product.material)
    );
  }
  return materialsByCategory[product.category]?.includes(product.material) ?? false;
}

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function makeRows(categoryIds, rules) {
  return rules.map((rule) => ({
    ...rule,
    category_id: categoryIds[rule.category],
  }));
}

function buildStandardRules(categoryIds) {
  const categoryRules = [];
  const subcategoryRules = [];
  const accessoryRules = [];

  for (const [category, categoryMaterials] of Object.entries(
    materialsByCategory,
  )) {
    const applicableMaterials =
      category === "Varones"
        ? categoryMaterials.filter((material) => material !== "Artesanal")
        : categoryMaterials;
    categoryRules.push(
      ...applicableMaterials.map((material) => ({ category, material })),
    );
  }

  subcategoryRules.push(
    { category: "Dijes", subcategory: "Iniciales", material: "Xuping" },
    { category: "Dijes", subcategory: "Iniciales", material: "Acero" },
  );

  accessoryRules.push(
    { category: "Varones", accessory_type: "Cadenas", material: "Acero" },
    { category: "Varones", accessory_type: "Pulseras", material: "Acero" },
    { category: "Varones", accessory_type: "Anillos", material: "Acero" },
    ...masculineWalletMaterials.map((material) => ({
      category: "Varones",
      accessory_type: "Billeteras",
      material,
    })),
  );

  return {
    categoryRules: makeRows(categoryIds, categoryRules),
    subcategoryRules: makeRows(categoryIds, subcategoryRules),
    accessoryRules: makeRows(categoryIds, accessoryRules),
  };
}

async function upsertRules(connection, table, columns, rows) {
  if (rows.length === 0) return;
  const values = rows.map(() => `(${columns.map(() => "?").join(", ")}, 0)`);
  const parameters = rows.flatMap((row) =>
    columns.map((column) => row[column]),
  );
  await connection.execute(
    `INSERT INTO ${table} (${columns.join(", ")}, legacy_exception)
     VALUES ${values.join(", ")}
     ON DUPLICATE KEY UPDATE legacy_exception = 0`,
    parameters,
  );
}

async function addLegacyExceptions(
  connection,
  table,
  columns,
  rows,
) {
  if (rows.length === 0) return;
  const values = rows.map(() => `(${columns.map(() => "?").join(", ")}, 1)`);
  const parameters = rows.flatMap((row) =>
    columns.map((column) => row[column]),
  );
  await connection.execute(
    `INSERT INTO ${table} (${columns.join(", ")}, legacy_exception)
     VALUES ${values.join(", ")}
     ON DUPLICATE KEY UPDATE legacy_exception = 1`,
    parameters,
  );
}

async function removeUnusedLegacyExceptions(
  connection,
  table,
  columns,
  activeRows,
) {
  const activeKeys = new Set(activeRows.map((row) => ruleKey(row, columns)));
  const selectedColumns = columns.join(", ");
  const [existingRows] = await connection.execute(
    `SELECT ${selectedColumns}
     FROM ${table}
     WHERE legacy_exception = 1`,
  );
  for (const row of existingRows) {
    if (activeKeys.has(ruleKey(row, columns))) continue;
    const whereClause = columns.map((column) => `${column} = ?`).join(" AND ");
    const [[{ productCount }]] = await connection.execute(
      `SELECT COUNT(*) AS productCount FROM products WHERE ${whereClause}`,
      columns.map((column) => row[column]),
    );
    if (Number(productCount) > 0) continue;

    await connection.execute(
      `DELETE FROM ${table}
       WHERE ${whereClause} AND legacy_exception = 1`,
      columns.map((column) => row[column]),
    );
  }
}

async function removeObsoleteRules(connection, table, columns, currentRows) {
  const currentKeys = new Set(currentRows.map((row) => ruleKey(row, columns)));
  const selectedColumns = columns.join(", ");
  const [existingRows] = await connection.execute(
    `SELECT ${selectedColumns}
     FROM ${table}`,
  );
  const whereClause = columns.map((column) => `${column} = ?`).join(" AND ");

  for (const row of existingRows) {
    if (currentKeys.has(ruleKey(row, columns))) continue;
    const values = columns.map((column) => row[column]);
    const [[{ productCount }]] = await connection.execute(
      `SELECT COUNT(*) AS productCount FROM products WHERE ${whereClause}`,
      values,
    );
    if (Number(productCount) > 0) {
      await connection.execute(
        `UPDATE ${table}
         SET legacy_exception = 1
         WHERE ${whereClause}`,
        values,
      );
    } else {
      await connection.execute(
        `DELETE FROM ${table}
         WHERE ${whereClause}`,
        values,
      );
    }
  }
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
  const [categoryRows] = await connection.execute(
    "SELECT id, name FROM categories",
  );
  const categoryIds = Object.fromEntries(
    categoryRows.map((row) => [row.name, Number(row.id)]),
  );
  const missingCategories = categories.filter(
    (category) => !Number.isInteger(categoryIds[category]),
  );
  if (missingCategories.length > 0) {
    throw new Error(
      `Missing database categories: ${missingCategories.join(", ")}`,
    );
  }

  const [columnRows] = await connection.execute(
    `SELECT COLUMN_TYPE, IS_NULLABLE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'products'
       AND COLUMN_NAME = 'material'
     LIMIT 1`,
  );
  const materialColumn = columnRows[0];
  if (!materialColumn) {
    throw new Error("The products.material column does not exist.");
  }
  if (materialColumn.IS_NULLABLE !== "NO") {
    throw new Error("The products.material column must be NOT NULL.");
  }

  const [productRows] = await connection.execute(
    `SELECT p.id, p.category_id AS categoryId, p.material, p.subcategory,
            p.accessory_type AS accessoryType, c.name AS category
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id`,
  );
  const unknownMaterials = [
    ...new Set(
      productRows
        .map((product) => product.material)
        .filter((material) => !materials.includes(material)),
    ),
  ];
  if (unknownMaterials.length > 0) {
    throw new Error(
      `Unsupported material values exist in products: ${unknownMaterials.join(", ")}`,
    );
  }

  const enumValues = materials.map(quote).join(", ");
  const expectedColumnType = `enum(${materials
    .map((material) => quote(material).toLowerCase())
    .join(",")})`;
  const normalize = (value) =>
    value.toLowerCase().replaceAll(" ", "").replaceAll("`", "");
  if (normalize(materialColumn.COLUMN_TYPE) !== normalize(expectedColumnType)) {
    await connection.query(
      `ALTER TABLE products MODIFY COLUMN material ENUM(${enumValues}) NOT NULL`,
    );
    console.log("Updated products.material to the supported material list.");
  }

  const enumDefinition = `ENUM(${enumValues})`;
  await connection.query(`CREATE TABLE IF NOT EXISTS category_material_rules (
    category_id INT UNSIGNED NOT NULL,
    material ${enumDefinition} NOT NULL,
    legacy_exception TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (category_id, material),
    CONSTRAINT fk_category_material_rules_category
      FOREIGN KEY (category_id) REFERENCES categories (id)
      ON UPDATE CASCADE ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await connection.query(`CREATE TABLE IF NOT EXISTS subcategory_material_rules (
    category_id INT UNSIGNED NOT NULL,
    subcategory VARCHAR(32) NOT NULL,
    material ${enumDefinition} NOT NULL,
    legacy_exception TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (category_id, subcategory, material),
    CONSTRAINT fk_subcategory_material_rules_category
      FOREIGN KEY (category_id) REFERENCES categories (id)
      ON UPDATE CASCADE ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await connection.query(`CREATE TABLE IF NOT EXISTS accessory_material_rules (
    category_id INT UNSIGNED NOT NULL,
    accessory_type VARCHAR(32) NOT NULL,
    material ${enumDefinition} NOT NULL,
    legacy_exception TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (category_id, accessory_type, material),
    CONSTRAINT fk_accessory_material_rules_category
      FOREIGN KEY (category_id) REFERENCES categories (id)
      ON UPDATE CASCADE ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  const [productColumns] = await connection.execute(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'products'`,
  );
  const existingColumns = new Set(
    productColumns.map((column) => column.COLUMN_NAME),
  );
  const requiredIndexes = [
    {
      name: "idx_products_category_material",
      columns: "(category_id, material)",
    },
    {
      name: "idx_products_subcategory_material",
      columns: "(category_id, subcategory, material)",
    },
    {
      name: "idx_products_accessory_material",
      columns: "(category_id, accessory_type, material)",
    },
  ];
  for (const index of requiredIndexes) {
    const [indexes] = await connection.execute(
      `SELECT INDEX_NAME FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'products'
         AND INDEX_NAME = ?
       LIMIT 1`,
      [index.name],
    );
    if (indexes.length === 0) {
      await connection.query(
        `ALTER TABLE products ADD KEY ${index.name} ${index.columns}`,
      );
      console.log(`Added index ${index.name}.`);
    }
  }

  if (!existingColumns.has("subcategory")) {
    throw new Error("The products.subcategory column does not exist.");
  }
  if (!existingColumns.has("accessory_type")) {
    throw new Error("The products.accessory_type column does not exist.");
  }

  const standardRules = buildStandardRules(categoryIds);
  const categoryColumn = ["category_id", "material"];
  const subcategoryColumn = ["category_id", "subcategory", "material"];
  const accessoryColumn = ["category_id", "accessory_type", "material"];
  await upsertRules(
    connection,
    "category_material_rules",
    categoryColumn,
    standardRules.categoryRules,
  );
  await upsertRules(
    connection,
    "subcategory_material_rules",
    subcategoryColumn,
    standardRules.subcategoryRules,
  );
  await upsertRules(
    connection,
    "accessory_material_rules",
    accessoryColumn,
    standardRules.accessoryRules,
  );

  const invalidProducts = productRows.filter(
    (product) => !isMaterialAllowed(product),
  );
  const legacyCategoryRules = [
    ...new Map(
      invalidProducts.map((product) => {
        const row = {
          category_id: Number(product.categoryId),
          material: product.material,
        };
        return [ruleKey(row, categoryColumn), row];
      }),
    ).values(),
  ];
  const legacySubcategoryRules = [
    ...new Map(
      invalidProducts
        .filter((product) => product.subcategory !== null)
        .map((product) => {
          const row = {
            category_id: Number(product.categoryId),
            subcategory: product.subcategory,
            material: product.material,
          };
          return [ruleKey(row, subcategoryColumn), row];
        }),
    ).values(),
  ];
  const legacyAccessoryRules = [
    ...new Map(
      invalidProducts
        .filter((product) => product.accessoryType !== null)
        .map((product) => {
          const row = {
            category_id: Number(product.categoryId),
            accessory_type: product.accessoryType,
            material: product.material,
          };
          return [ruleKey(row, accessoryColumn), row];
        }),
    ).values(),
  ];
  await addLegacyExceptions(
    connection,
    "category_material_rules",
    categoryColumn,
    legacyCategoryRules,
  );
  await addLegacyExceptions(
    connection,
    "subcategory_material_rules",
    subcategoryColumn,
    legacySubcategoryRules,
  );
  await addLegacyExceptions(
    connection,
    "accessory_material_rules",
    accessoryColumn,
    legacyAccessoryRules,
  );

  await removeUnusedLegacyExceptions(
    connection,
    "category_material_rules",
    categoryColumn,
    legacyCategoryRules,
  );
  await removeUnusedLegacyExceptions(
    connection,
    "subcategory_material_rules",
    subcategoryColumn,
    legacySubcategoryRules,
  );
  await removeUnusedLegacyExceptions(
    connection,
    "accessory_material_rules",
    accessoryColumn,
    legacyAccessoryRules,
  );

  await removeObsoleteRules(
    connection,
    "category_material_rules",
    categoryColumn,
    [...standardRules.categoryRules, ...legacyCategoryRules],
  );
  await removeObsoleteRules(
    connection,
    "subcategory_material_rules",
    subcategoryColumn,
    [...standardRules.subcategoryRules, ...legacySubcategoryRules],
  );
  await removeObsoleteRules(
    connection,
    "accessory_material_rules",
    accessoryColumn,
    [...standardRules.accessoryRules, ...legacyAccessoryRules],
  );

  const foreignKeys = [
    {
      name: "fk_products_category_material",
      columns: "(category_id, material)",
      reference: "category_material_rules (category_id, material)",
    },
    {
      name: "fk_products_subcategory_material",
      columns: "(category_id, subcategory, material)",
      reference:
        "subcategory_material_rules (category_id, subcategory, material)",
    },
    {
      name: "fk_products_accessory_material",
      columns: "(category_id, accessory_type, material)",
      reference:
        "accessory_material_rules (category_id, accessory_type, material)",
    },
  ];
  for (const foreignKey of foreignKeys) {
    const [existingForeignKeys] = await connection.execute(
      `SELECT CONSTRAINT_NAME
       FROM information_schema.TABLE_CONSTRAINTS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'products'
         AND CONSTRAINT_TYPE = 'FOREIGN KEY'
         AND CONSTRAINT_NAME = ?
       LIMIT 1`,
      [foreignKey.name],
    );
    if (existingForeignKeys.length === 0) {
      await connection.query(
        `ALTER TABLE products
         ADD CONSTRAINT ${foreignKey.name}
         FOREIGN KEY ${foreignKey.columns}
         REFERENCES ${foreignKey.reference}`,
      );
      console.log(`Added enforced foreign key ${foreignKey.name}.`);
    }
  }

  console.log(
    `Existing products preserved; ${invalidProducts.length} incompatible product(s) remain editable and temporarily grandfathered until corrected.`,
  );
} catch (error) {
  const errorCode =
    error && typeof error === "object" && "code" in error
      ? error.code
      : "unknown error";
  const errorMessage =
    error && typeof error === "object" && "sqlMessage" in error
      ? error.sqlMessage
      : error instanceof Error
        ? error.message
        : "unknown error";
  console.error(
    "Material rules migration failed:",
    errorCode,
    errorMessage,
  );
  process.exitCode = 1;
} finally {
  await connection.end();
}
