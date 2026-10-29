# Base de datos

El proyecto usa MySQL mediante `mysql2`. `schema.sql` define las tablas
`categories`, `products` y `admin_login_attempts`; carga primero las categorías
requeridas por el catálogo antes de usar la API o cargar productos de muestra.
La tabla `products` incluye `imagekit_file_id` para borrar archivos de ImageKit
cuando se reemplaza una foto o se elimina su producto.

## TiDB Cloud

Los comandos npm `apply-schema`, `seed` y `verify-db` cargan las variables de
`.env.local` con el soporte `--env-file` de Node.js. Para usar otro origen,
invoca directamente `node --env-file=<archivo-local> scripts/<script>.mjs`.
No copies credenciales a archivos rastreados. Para TiDB Cloud, configura
`DB_HOST`, `DB_PORT=4000`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `DB_SSL=true`
en la terminal. La conexión TLS exige TLS 1.2 como mínimo y verifica el
certificado del servidor.

En PowerShell, puedes solicitar el usuario y la contraseña de forma interactiva
(la contraseña no se muestra ni se guarda en un archivo) y aplicar el esquema:

```powershell
$env:DB_HOST = "gateway01.sa-east-1.prod.aws.tidbcloud.com"
$env:DB_PORT = "4000"
$env:DB_NAME = "sarita_joyeria"
$env:DB_SSL = "true"
$env:DB_USER = Read-Host "TiDB schema administrator username"
$secret = Read-Host "TiDB schema administrator password" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
  $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  npm run apply-schema
  if ($LASTEXITCODE -ne 0) { throw "Schema application failed." }
} finally {
  Remove-Item Env:DB_PASSWORD, Env:DB_USER -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  $secret.Dispose()
}
```

`apply-schema` runs `database/schema.sql` and the idempotent
`database/seed-categories.sql`. Schema application requires a TiDB user with
DDL permissions. After the schema is ready, set `DB_USER` and `DB_PASSWORD` to
the restricted application account before running `npm run seed` and
`npm run verify-db`. The latter prints only the category and product counts.
Each script requires `DB_SSL=true`; `multipleStatements` is enabled only by
`apply-schema` to execute the schema file.

Create `sarita_app` using the TiDB Cloud SQL user-management interface or an
authorized administrative SQL connection. For a database that permits standard
MySQL account management, the intended grants are:

```sql
CREATE USER 'sarita_app'@'%' IDENTIFIED BY '<set-a-new-password>';
GRANT SELECT, INSERT, UPDATE, DELETE ON sarita_joyeria.* TO 'sarita_app'@'%';
```

Do not use the administrative account for the application. If your TiDB Cloud
plan does not allow creating SQL users or applying these grants, use the
provider-supported SQL user management or request the required capability;
do not deploy the application with an unrestricted administrative account.

## Esquema y categorías

El comando `npm run apply-schema` crea la base si no existe, aplica las tablas
idempotentes de `database/schema.sql` y asegura las categorías de
`database/seed-categories.sql`. Usa una cuenta TiDB con permisos de creación de
base de datos y tablas. El comando requiere el host, puerto, usuario,
contraseña, base y `DB_SSL=true`.

## Configuración de la aplicación

Copia `.env.example` a `.env.local` y configura allí el host, puerto, usuario,
contraseña y nombre de la base de datos de tu entorno. No compartas ni subas
`.env.local` al repositorio. La aplicación web carga esa configuración; los
scripts CLI requieren que las variables estén presentes en el entorno del
proceso y cargan `.env.local` mediante Node.js `--env-file`.

Tanto en desarrollo como en producción, la aplicación exige un host remoto,
`DB_PORT` explícito y `DB_SSL=true`; usa TLS 1.2 como mínimo y verifica el
certificado. Las direcciones de loopback y las conexiones sin TLS se rechazan.

El usuario MySQL de producción debe ser exclusivo de la aplicación y tener
solo los permisos requeridos: `SELECT` sobre `categories`; `SELECT`, `INSERT`,
`UPDATE` y `DELETE` sobre `products`; y `SELECT`, `INSERT`, `UPDATE` y
`DELETE` sobre `admin_login_attempts` para el limitador de inicio de sesión.
El script CLI de seed necesita además leer `categories` e insertar/actualizar
`products`.

Las imágenes existentes que no sean rutas del sitio, HTTPS de
`images.unsplash.com` o URLs HTTPS de `ik.imagekit.io/sxvg5dlmq` se sirven como
`/logo-luna.png` hasta que se reemplace su URL desde el panel.

Para una base ya creada antes de agregar soporte de ImageKit, aplica una sola
vez esta migración con una cuenta que tenga permisos DDL:

```sql
ALTER TABLE products
  ADD COLUMN imagekit_file_id VARCHAR(128) NULL,
  ADD KEY idx_products_imagekit_file_id (imagekit_file_id);
```

La cuenta restringida `sarita_app` no tiene permisos para ejecutar este cambio.
No se ejecuta automáticamente desde la app.

Configura `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `DB_SSL`
en `.env.local` para desarrollo y en el gestor de variables de entorno para
producción. Si falta una variable, la aplicación falla en vez de usar valores
predeterminados o conectarse a una base local.

Después de configurar la conexión, inicia Next.js con `npm run dev`. Para
cargar los productos de muestra desde una terminal, ejecuta `npm run seed`
con las variables de entorno requeridas configuradas. No existen rutas web de
seed o diagnóstico de base de datos.
