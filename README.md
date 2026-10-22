# Sarita Joyería y Accesorios

Catálogo de joyas y accesorios construido con Next.js, TypeScript y Tailwind CSS.

## Getting Started

Instala dependencias y ejecuta el servidor local:

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Administración de productos

Visita [http://localhost:3000/admin](http://localhost:3000/admin) para probar
la interfaz de administración. Esta versión es un prototipo sin autenticación:
los productos y las imágenes pequeñas se guardan únicamente en el navegador
actual y no se sincronizan con otros dispositivos. No publiques esta ruta como
panel de administración real hasta agregar autenticación y almacenamiento del
lado del servidor.

## Preparación de Supabase

El cliente de navegador está preparado en `src/lib/supabase/client.ts`. Cuando
se configure el proyecto de Supabase, crea un archivo `.env.local` (ignorado
por Git) con las credenciales públicas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Reinicia el servidor después de modificar las variables. No guardes claves
secretas de servicio en variables `NEXT_PUBLIC_*` ni en el cliente.

La interfaz todavía usa almacenamiento local; conectar Supabase requiere
configurar tablas, Storage, políticas de acceso y autenticación de
administradores.

### Separar categorías existentes

Si la base de datos usa `public.productos(categoria)`, ejecuta los archivos
SQL en este orden desde el editor de Supabase y deja que el primero termine
antes de ejecutar el segundo:

1. `supabase/migrations/20261022_split_product_categories_phase1.sql`
2. `supabase/migrations/20261022_split_product_categories_phase2.sql`

La segunda fase reasigna las antiguas categorías agrupadas a una categoría
representativa (por ejemplo, `Aritos & Argollas` a `Aritos`) para que luego se
puedan clasificar con precisión. Revisa y ajusta los nombres de tabla y columna
si tu esquema no coincide; este proyecto aún no tiene credenciales para ejecutar
la migración en Supabase.
