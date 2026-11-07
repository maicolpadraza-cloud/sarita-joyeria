INSERT INTO category_material_rules (
  category_id,
  material,
  legacy_exception
)
SELECT c.id, r.material, 0
FROM categories AS c
INNER JOIN (
  SELECT 'Aritos' AS category_name, 'Artesanal' AS material
  UNION ALL SELECT 'Aritos', 'Folheado'
  UNION ALL SELECT 'Aritos', 'Acero'
  UNION ALL SELECT 'Aritos', 'Magold'
  UNION ALL SELECT 'Aritos', 'Xuping'
  UNION ALL SELECT 'Argollas', 'Artesanal'
  UNION ALL SELECT 'Argollas', 'Folheado'
  UNION ALL SELECT 'Argollas', 'Acero'
  UNION ALL SELECT 'Argollas', 'Magold'
  UNION ALL SELECT 'Argollas', 'Xuping'
  UNION ALL SELECT 'Collares', 'Artesanal'
  UNION ALL SELECT 'Collares', 'Acero'
  UNION ALL SELECT 'Collares', 'Magold'
  UNION ALL SELECT 'Collares', 'Xuping'
  UNION ALL SELECT 'Dijes', 'Artesanal'
  UNION ALL SELECT 'Dijes', 'Acero'
  UNION ALL SELECT 'Dijes', 'Magold'
  UNION ALL SELECT 'Dijes', 'Xuping'
  UNION ALL SELECT 'Rosarios', 'Acero'
  UNION ALL SELECT 'Rosarios', 'Xuping'
  UNION ALL SELECT 'Anillos', 'Acero'
  UNION ALL SELECT 'Anillos', 'Magold'
  UNION ALL SELECT 'Anillos', 'Xuping'
  UNION ALL SELECT 'Pulseras', 'Acero'
  UNION ALL SELECT 'Pulseras', 'Magold'
  UNION ALL SELECT 'Pulseras', 'Xuping'
  UNION ALL SELECT 'Piercings', 'Folheado'
  UNION ALL SELECT 'Piercings', 'Titanio'
  UNION ALL SELECT 'Piercings', 'Acero'
  UNION ALL SELECT 'Conjuntos', 'Acero'
  UNION ALL SELECT 'Conjuntos', 'Xuping'
  UNION ALL SELECT 'Conjuntos', 'Magold'
  UNION ALL SELECT 'Relojes', 'Acero'
  UNION ALL SELECT 'Carteras', 'Cuero sintético'
  UNION ALL SELECT 'Billeteras', 'Cuero sintético'
  UNION ALL SELECT 'Mini joyeros', 'Artesanal'
  UNION ALL SELECT 'Varones', 'Acero'
  UNION ALL SELECT 'Varones', 'Xuping'
  UNION ALL SELECT 'Varones', 'Magold'
  UNION ALL SELECT 'Varones', 'Folheado'
  UNION ALL SELECT 'Varones', 'Cuero sintético'
  UNION ALL SELECT 'Tobilleras', 'Xuping'
  UNION ALL SELECT 'Tobilleras', 'Acero'
) AS r ON r.category_name = c.name
ON DUPLICATE KEY UPDATE legacy_exception = 0;

INSERT INTO subcategory_material_rules (
  category_id,
  subcategory,
  material,
  legacy_exception
)
SELECT c.id, r.subcategory, r.material, 0
FROM categories AS c
INNER JOIN (
  SELECT 'Dijes' AS category_name, 'Iniciales' AS subcategory, 'Xuping' AS material
  UNION ALL SELECT 'Dijes', 'Iniciales', 'Acero'
) AS r ON r.category_name = c.name
ON DUPLICATE KEY UPDATE legacy_exception = 0;

INSERT INTO accessory_material_rules (
  category_id,
  accessory_type,
  material,
  legacy_exception
)
SELECT c.id, r.accessory_type, r.material, 0
FROM categories AS c
INNER JOIN (
  SELECT 'Varones' AS category_name, 'Cadenas' AS accessory_type, 'Acero' AS material
  UNION ALL SELECT 'Varones', 'Pulseras', 'Acero'
  UNION ALL SELECT 'Varones', 'Anillos', 'Acero'
  UNION ALL SELECT 'Varones', 'Billeteras', 'Cuero sintético'
) AS r ON r.category_name = c.name
ON DUPLICATE KEY UPDATE legacy_exception = 0;
