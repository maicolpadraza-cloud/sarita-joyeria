CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) NOT NULL,
  name VARCHAR(150) NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  subcategory VARCHAR(32) NULL,
  accessory_type VARCHAR(32) NULL,
  material VARCHAR(32) NOT NULL,
  closure_type VARCHAR(32) NULL,
  price DECIMAL(10, 2) NOT NULL,
  image MEDIUMTEXT NOT NULL,
  description LONGTEXT NOT NULL,
  in_stock TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_products_category_id (category_id),
  KEY idx_products_in_stock (in_stock),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id)
    REFERENCES categories (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
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
