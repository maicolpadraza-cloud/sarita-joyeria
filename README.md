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

Visita [http://localhost:3000/admin](http://localhost:3000/admin) para
administrar el catálogo. El acceso requiere el usuario y el hash de contraseña
configurados en `ADMIN_USER` y `ADMIN_PASSWORD_HASH`. Las escrituras se guardan
en MySQL; en desarrollo, el navegador puede usar también su respaldo local.

### Configurar credenciales del administrador

1. Genera un hash bcrypt en tu terminal. El script solicita la contraseña dos
   veces y muestra solo el hash, con cada `$` escapado como `\$` para pegarlo
   directamente en un archivo `.env`:

   ```bash
   node scripts/hash-password.mjs
   ```

2. Pega el hash tal como lo imprime el script en `ADMIN_PASSWORD_HASH` de
   `.env.local`. Next.js elimina el escape `\` al cargar el archivo, por lo que
   la aplicación recibe el bcrypt convencional con `$` y puede verificarlo.
   No elimines esas barras del archivo. Para proveedores de despliegue que
   configuran variables directamente en su panel, guarda el bcrypt normal
   (sin barras). Configura también `ADMIN_USER` y un
   `SESSION_SECRET` aleatorio de al menos 32 caracteres en `.env.local` para
   desarrollo y en el gestor de variables de entorno de producción. Puedes
   generar el secreto de sesión con:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

   Nunca uses una contraseña en texto plano como variable de entorno ni
   guardes credenciales o secretos en el repositorio. La referencia y la regla
   de escape del hash están en `.env.example`.

3. Ejecuta `database/schema.sql` para crear también la tabla de límite de
   intentos de inicio de sesión. El límite es de cinco intentos por IP cada
   15 minutos y se almacena en MySQL para que siga vigente entre reinicios e
   instancias. Configura el proxy de despliegue para establecer o sobrescribir
   `X-Forwarded-For` o `X-Real-IP` con la IP real del cliente.

   En producción, establece `DB_SSL=true`. La conexión MySQL usará TLS y
   verificará el certificado del servidor; la aplicación rechaza iniciar el pool
   de producción si SSL no está habilitado.

El inicio de sesión usa una cookie HttpOnly de ocho horas, `SameSite=Strict` y
`Secure` en producción. La ruta `/admin` redirige al formulario
`/admin/login` si la sesión no es válida; los endpoints de escritura vuelven a
validar la misma sesión en el servidor.

## Cargar productos de muestra

Las rutas web `/api/seed` y `/api/db-test` no existen. Para cargar o actualizar
los productos de muestra manualmente, configura las variables de TiDB Cloud en
`.env.local` y ejecuta:

```bash
npm run seed
```

El comando exige `DB_SSL=true` y usa TLS 1.2 como mínimo con verificación
del certificado. La API solo acepta imágenes como ruta local (por ejemplo
`/images/joya.jpg`), URL HTTPS de `images.unsplash.com` o de
`ik.imagekit.io/sxvg5dlmq`.

## Fotos de productos con ImageKit

El panel `/admin` permite seleccionar fotos desde computadora o celular
(cámara o galería). Acepta JPEG, PNG, WebP y HEIC; convierte HEIC y prepara la
imagen en el navegador (lado largo máximo de 2400 px, calidad alta y objetivo
menor a 1,5 MB) antes de subirla directamente a ImageKit. La clave privada
solo se usa en el servidor; configura `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`,
`NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` e `IMAGEKIT_PRIVATE_KEY` en `.env.local` y
en las variables de entorno de Vercel. No guardes las imágenes en MySQL: allí
solo se conservan la URL y el identificador de archivo necesario para poder
borrar de ImageKit al reemplazar o eliminar un producto.

Para instalaciones existentes, agrega la columna antes de desplegar:

```sql
ALTER TABLE products
  ADD COLUMN imagekit_file_id VARCHAR(128) NULL,
  ADD KEY idx_products_imagekit_file_id (imagekit_file_id);
```

Para instalaciones nuevas, la columna ya está en `database/schema.sql`. El
contador del panel estima el espacio de la carpeta `/sarita/productos` y avisa
al superar el 70 % de la referencia de 5 GB.

Para preparar la foto, encuadra la joya en relación 1:1 o 4:5, usa un fondo
limpio y luz natural indirecta. Deja espacio alrededor para que el recorte
cuadrado del catálogo no corte la pieza.

Las respuestas incluyen CSP, protección contra framing y MIME sniffing,
Referrer-Policy y Permissions-Policy; en producción también activan HSTS.
`/robots.txt` excluye `/admin` y `/api` del rastreo. El renderizado de textos
de productos usa nodos de texto de React, no HTML insertado.

## Base de datos MySQL

Consulta [`database/README.md`](database/README.md) para aplicar el esquema de
TiDB Cloud, cargar las categorías y configurar sus variables de entorno.

Para publicar el catálogo en GitHub privado y Vercel, sigue la guía para
principiantes [`DEPLOY.md`](DEPLOY.md).
