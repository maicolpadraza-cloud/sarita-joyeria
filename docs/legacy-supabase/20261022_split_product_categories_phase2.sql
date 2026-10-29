-- Phase 2 for public.productos(categoria).
-- Historical Supabase migration; it is not used by the current MySQL backend.
-- Run only after the Phase 1 script has committed. Grouped legacy categories
-- are assigned to one representative category for later manual classification.

DO $phase_two$
DECLARE
  table_id regclass;
  category_type oid;
  category_type_kind "char";
  category_type_schema text;
  category_type_name text;
  category_type_sql text;
BEGIN
  SELECT relation.oid::regclass
    INTO table_id
    FROM pg_class AS relation
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
   WHERE namespace.nspname = 'public'
     AND relation.relname = 'productos'
     AND relation.relkind IN ('r', 'p');

  IF table_id IS NULL THEN
    RAISE EXCEPTION 'No existe la tabla public.productos; ajusta el nombre en esta migración.';
  END IF;

  SELECT attribute.atttypid, type.typtype,
         type_namespace.nspname, type.typname
    INTO category_type, category_type_kind,
         category_type_schema, category_type_name
    FROM pg_attribute AS attribute
    JOIN pg_type AS type ON type.oid = attribute.atttypid
    JOIN pg_namespace AS type_namespace
      ON type_namespace.oid = type.typnamespace
   WHERE attribute.attrelid = table_id
     AND attribute.attname = 'categoria'
     AND NOT attribute.attisdropped;

  IF category_type IS NULL THEN
    RAISE EXCEPTION 'No existe la columna categoria en public.productos.';
  END IF;

  category_type_sql := CASE
    WHEN category_type_kind = 'e'
      THEN format('%I.%I', category_type_schema, category_type_name)
    ELSE format_type(category_type, NULL)
  END;

  EXECUTE format(
    'UPDATE %s
        SET categoria = (
          CASE categoria::text
            WHEN %L THEN %L
            WHEN %L THEN %L
            WHEN %L THEN %L
            WHEN %L THEN %L
            WHEN %L THEN %L
            WHEN %L THEN %L
            WHEN %L THEN %L
            ELSE categoria::text
          END
        )::%s',
    table_id,
    'Aritos & Argollas', 'Aritos',
    'Collares & Dijes', 'Collares',
    'Anillos & Pulseras', 'Anillos',
    'Piercings & Titanio', 'Piercings',
    'Conjuntos & Relojes', 'Conjuntos',
    'Bolsos & Marroquinería', 'Carteras',
    'Carteras & Billeteras', 'Carteras',
    category_type_sql
  );

  ALTER TABLE public.productos
    DROP CONSTRAINT IF EXISTS productos_categoria_split_migration_check;
  ALTER TABLE public.productos
    DROP CONSTRAINT IF EXISTS productos_categoria_split_check;

  ALTER TABLE public.productos
    ADD CONSTRAINT productos_categoria_split_check
    CHECK (categoria::text = ANY (ARRAY[
      'Aritos', 'Argollas', 'Collares', 'Dijes', 'Anillos', 'Pulseras',
      'Piercings', 'Titanio', 'Conjuntos', 'Relojes', 'Carteras',
      'Billeteras', 'Varones'
    ]::text[]));
END
$phase_two$;
