INSERT INTO categories (name)
VALUES
  ('Aritos'),
  ('Argollas'),
  ('Collares'),
  ('Dijes'),
  ('Rosarios'),
  ('Anillos'),
  ('Pulseras'),
  ('Piercings'),
  ('Titanio'),
  ('Conjuntos'),
  ('Relojes'),
  ('Carteras'),
  ('Billeteras'),
  ('Mini joyeros'),
  ('Varones'),
  ('Tobilleras')
ON DUPLICATE KEY UPDATE
  name = VALUES(name);
