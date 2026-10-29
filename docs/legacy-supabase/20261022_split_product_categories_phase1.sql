-- Phase 1 for public.productos(categoria).
-- Historical Supabase migration; it is not used by the current MySQL backend.
-- Run this script by itself in the Supabase SQL Editor and let it commit before
-- running 20261022_split_product_categories_phase2.sql.
-- Adds split labels to an ENUM and temporarily allows both old and new labels
-- in CHECK constraints so existing rows remain valid during the migration.

DO $phase_one$
DECLARE
  table_id regclass;
  category_attribute smallint;
  category_type oid;
  category_type_kind "char";
  enum_label text;
  enum_schema text;
  enum_name text;
  existing_check record;
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

  SELECT attribute.attnum, attribute.atttypid, type.typtype,
         type_namespace.nspname, type.typname
    INTO category_attribute, category_type, category_type_kind,
         enum_schema, enum_name
    FROM pg_attribute AS attribute
    JOIN pg_type AS type ON type.oid = attribute.atttypid
    JOIN pg_namespace AS type_namespace
      ON type_namespace.oid = type.typnamespace
   WHERE attribute.attrelid = table_id
     AND attribute.attname = 'categoria'
     AND NOT attribute.attisdropped;

  IF category_attribute IS NULL THEN
    RAISE EXCEPTION 'No existe la columna categoria en public.productos.';
  END IF;

  IF category_type_kind = 'e' THEN
    FOREACH enum_label IN ARRAY ARRAY[
      'Aritos', 'Argollas', 'Collares', 'Dijes', 'Anillos', 'Pulseras',
      'Piercings', 'Titanio', 'Conjuntos', 'Relojes', 'Carteras',
      'Billeteras', 'Varones'
    ]
    LOOP
      IF NOT EXISTS (
        SELECT 1
          FROM pg_enum
         WHERE enumtypid = category_type
           AND enumlabel = enum_label
      ) THEN
        EXECUTE format(
          'ALTER TYPE %I.%I ADD VALUE %L',
          enum_schema,
          enum_name,
          enum_label
        );
      END IF;
    END LOOP;
  END IF;

  FOR existing_check IN
    SELECT constraint_row.conname
      FROM pg_constraint AS constraint_row
     WHERE constraint_row.conrelid = table_id
       AND constraint_row.contype = 'c'
       AND category_attribute = ANY (constraint_row.conkey)
  LOOP
    EXECUTE format(
      'ALTER TABLE %s DROP CONSTRAINT %I',
      table_id,
      existing_check.conname
    );
  END LOOP;

  EXECUTE format(
    'ALTER TABLE %s ADD CONSTRAINT productos_categoria_split_migration_check
       CHECK (categoria::text = ANY (ARRAY[
         %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L,
         %L, %L, %L, %L, %L, %L, %L
       ]::text[]))',
    table_id,
    'Aritos', 'Argollas', 'Collares', 'Dijes', 'Anillos', 'Pulseras',
    'Piercings', 'Titanio', 'Conjuntos', 'Relojes', 'Carteras',
    'Billeteras', 'Varones',
    'Aritos & Argollas', 'Collares & Dijes', 'Anillos & Pulseras',
    'Piercings & Titanio', 'Conjuntos & Relojes',
    'Bolsos & Marroquinería', 'Carteras & Billeteras'
  );
END
$phase_one$;
