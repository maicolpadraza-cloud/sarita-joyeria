CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS category_material_rules (
  category_id INT UNSIGNED NOT NULL,
  material ENUM(
    'Xuping',
    'Magold',
    'Folheado',
    'Acero',
    'Titanio',
    'Artesanal',
    'Cuero sintético'
  ) NOT NULL,
  legacy_exception TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (category_id, material),
  CONSTRAINT fk_category_material_rules_category
    FOREIGN KEY (category_id)
    REFERENCES categories (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subcategory_material_rules (
  category_id INT UNSIGNED NOT NULL,
  subcategory VARCHAR(32) NOT NULL,
  material ENUM(
    'Xuping',
    'Magold',
    'Folheado',
    'Acero',
    'Titanio',
    'Artesanal',
    'Cuero sintético'
  ) NOT NULL,
  legacy_exception TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (category_id, subcategory, material),
  CONSTRAINT fk_subcategory_material_rules_category
    FOREIGN KEY (category_id)
    REFERENCES categories (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS accessory_material_rules (
  category_id INT UNSIGNED NOT NULL,
  accessory_type VARCHAR(32) NOT NULL,
  material ENUM(
    'Xuping',
    'Magold',
    'Folheado',
    'Acero',
    'Titanio',
    'Artesanal',
    'Cuero sintético'
  ) NOT NULL,
  legacy_exception TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (category_id, accessory_type, material),
  CONSTRAINT fk_accessory_material_rules_category
    FOREIGN KEY (category_id)
    REFERENCES categories (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Seed accessory/material combinations from database/seed-material-rules.sql.
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(150) NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  subcategory VARCHAR(32) NULL,
  accessory_type VARCHAR(32) NULL,
  material ENUM(
    'Xuping',
    'Magold',
    'Folheado',
    'Acero',
    'Titanio',
    'Artesanal',
    'Cuero sintético'
  ) NOT NULL,
  closure_type VARCHAR(32) NULL,
  price DECIMAL(10, 2) NOT NULL,
  image MEDIUMTEXT NOT NULL,
  imagekit_file_id VARCHAR(128) NULL,
  description LONGTEXT NOT NULL,
  in_stock TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_code (code),
  KEY idx_products_category_id (category_id),
  KEY idx_products_in_stock (in_stock),
  KEY idx_products_imagekit_file_id (imagekit_file_id),
  KEY idx_products_category_material (category_id, material),
  KEY idx_products_subcategory_material (
    category_id,
    subcategory,
    material
  ),
  KEY idx_products_accessory_material (
    category_id,
    accessory_type,
    material
  ),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id)
    REFERENCES categories (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_products_category_material
    FOREIGN KEY (category_id, material)
    REFERENCES category_material_rules (category_id, material),
  CONSTRAINT fk_products_subcategory_material
    FOREIGN KEY (category_id, subcategory, material)
    REFERENCES subcategory_material_rules (category_id, subcategory, material),
  CONSTRAINT fk_products_accessory_material
    FOREIGN KEY (category_id, accessory_type, material)
    REFERENCES accessory_material_rules (category_id, accessory_type, material)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  ip_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  window_started_at DATETIME NOT NULL,
  attempt_count TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (ip_hash),
  KEY idx_admin_login_attempts_window (window_started_at)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
