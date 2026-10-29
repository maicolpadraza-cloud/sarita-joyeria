# Publicar Sarita Joyería en Vercel

Esta guía te lleva desde el repositorio local hasta una página que puedas abrir
y probar desde el celular. La aplicación usa TiDB Cloud; **no** configures una
base MySQL local para el despliegue.

## 1. Comprobar que no hay secretos antes de GitHub

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
git status --short
git ls-files | Select-String '(^|/)\.env($|\.)'
git check-ignore .env.local
git check-ignore .env.production.local
```

La búsqueda de archivos rastreados no debe listar archivos `.env` reales. Es
normal que aparezca `.env.example`, que solo contiene nombres y valores de
ejemplo. Los dos comandos `git check-ignore` deben mostrar los archivos de
entorno locales como ignorados. No compartas capturas que muestren secretos.

Para comprobar posibles secretos en el historial sin imprimir coincidencias:

```powershell
git log --all --format= --name-only -- '*.env' '*.env.*'
```

Si un secreto llegó a un commit, quitar el archivo de la rama actual no basta:
róta ese secreto en el proveedor antes de publicar.

## 2. Subir el código a un repositorio privado de GitHub

1. Entra en [github.com](https://github.com) e inicia sesión.
2. Pulsa **New repository**.
3. Elige un nombre, por ejemplo `sarita-joyeria`.
4. Selecciona **Private**. No marques la opción para crear README, `.gitignore`
   o licencia: este proyecto ya contiene esos archivos.
5. Pulsa **Create repository**.
6. GitHub mostrará instrucciones para subir un repositorio existente. En la
   terminal del proyecto ejecuta los comandos de esa pantalla, normalmente:

   ```powershell
   git remote add origin https://github.com/TU-USUARIO/sarita-joyeria.git
   git add .
   git commit -m "Prepare Sarita catalog for deployment"
   git push -u origin main
   ```

   Si ya existe `origin`, no lo agregues otra vez: revisa `git remote -v` y usa
   `git push -u origin main`. No incluyas `.env.local` ni
   `.env.production.local`; el `.gitignore` los excluye.

## 3. Importar el proyecto en Vercel

1. Entra en [vercel.com](https://vercel.com) y elige **Continue with GitHub**.
2. Autoriza Vercel para acceder al repositorio privado. Puedes permitir solo
   `sarita-joyeria`.
3. Pulsa **Add New → Project**, busca el repositorio y selecciona **Import**.
4. Deja el framework como **Next.js** y conserva los comandos de instalación,
   build y salida que Vercel detecte. No agregues una variable `PORT`.
5. Antes de desplegar, abre **Environment Variables** y agrega las variables de
   la tabla siguiente a **Production**. Si también probarás previews, añádelas
   a **Preview**. Luego pulsa **Deploy**.

## 4. Variables de entorno de Vercel

Los valores reales se obtienen de tus cuentas TiDB, del panel del administrador
y de la URL pública. **No** copies aquí valores de ejemplo ni subas secretos a
GitHub.

| Variable | De dónde sale / qué poner |
|---|---|
| `DB_HOST` | Host del clúster TiDB Cloud, mostrado en la pantalla de conexión del clúster. |
| `DB_PORT` | Puerto de conexión indicado por TiDB Cloud (este proyecto usa el puerto configurado para su clúster). |
| `DB_USER` | Usuario SQL restringido de la app; en TiDB Cloud puede incluir el prefijo del clúster y `.sarita_app`. No uses el usuario administrador. |
| `DB_PASSWORD` | Contraseña actual de ese usuario SQL, obtenida o restablecida en TiDB Cloud. |
| `DB_NAME` | Nombre de la base de datos de la aplicación. |
| `DB_SSL` | Escribe `true`. La conexión exige TLS 1.2 o superior y verifica el certificado. |
| `ADMIN_USER` | Usuario elegido para iniciar sesión al panel `/admin`. |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt generado con `npm run hash-password`. En Vercel pega el hash con sus `$` normales: **no** antepongas `\`. No pongas la contraseña en texto plano. |
| `SESSION_SECRET` | Secreto aleatorio de al menos 32 caracteres para firmar las sesiones. Genera uno localmente; no lo publiques ni lo reutilices como contraseña. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número del negocio en formato internacional, solo dígitos, sin `+` ni espacios. |
| `NEXT_PUBLIC_SITE_URL` | URL canónica completa del sitio, incluyendo `https://`, sin barra final ni ruta. Para producción, usa el dominio `*.vercel.app` que te asigne Vercel; después cámbialo al dominio propio. |

En **Settings → Environment Variables**, añade cada variable por separado,
elige el entorno correspondiente y pulsa **Save**. Para regenerar el hash:

```powershell
npm run hash-password
```

El comando solicita una contraseña y muestra el hash bcrypt escapado para
`.env.local`; en Vercel quita únicamente las barras invertidas que escapan cada
`$` y pega los dólares normales (`$2b$12$...`). Configura o cambia variables
en Vercel y luego crea un nuevo despliegue para que surtan efecto.

Para generar `SESSION_SECRET` en PowerShell sin guardarlo en el proyecto:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

No escribas el resultado en un archivo rastreado, ticket, chat o captura.

## 5. Permitir la conexión de TiDB desde Vercel

Si el despliegue muestra un error de conexión, revisa la sección de **Network
Access / IP Access List** del clúster TiDB:

1. Identifica el método de salida de red disponible para tu plan de Vercel.
   Si tu plan ofrece **Static IPs** o **Secure Compute**, habilítalo y consulta
   las IP/CIDR de salida asignadas a tu proyecto o región.
2. Agrega esas IP/CIDR a la lista permitida de TiDB y guarda el cambio.
3. Verifica que el clúster esté activo y que el usuario tenga los permisos
   mínimos requeridos por la app.
4. Vuelve a desplegar y abre `https://TU-DOMINIO/api/health`.

Las direcciones de salida de funciones serverless pueden variar según el plan,
la región y la función. No supongas que la IP de tu computadora sirve para
Vercel. **No abras TiDB a todas las IP (`0.0.0.0/0`) como solución permanente**.
Si el plan no ofrece salida fija, consulta el mecanismo de conectividad privada
o egreso estático disponible para tu cuenta de Vercel/TiDB antes de habilitar
un acceso amplio.

`/api/health` devuelve `{"ok":true}` cuando la base responde. Si falla, devuelve
un `503` genérico sin incluir credenciales, dirección de servidor ni detalles
internos.

## 6. Probar desde el celular

1. Abre el enlace `*.vercel.app` que aparece en **Vercel → Deployments**.
2. Comprueba que cargan los productos y abre varios detalles.
3. Prueba los botones **Pedir por WhatsApp** y **Consultar disponibilidad**.
   El mensaje debe enlazar al dominio público, no a `localhost`.
4. Abre `https://TU-DOMINIO/admin`, inicia sesión con `ADMIN_USER` y la
   contraseña correspondiente al hash. Prueba crear, editar y borrar un
   producto de prueba, y luego cierra sesión.
5. Abre `https://TU-DOMINIO/sitemap.xml` para confirmar que incluye la página
   principal y los productos.

Para probar desde un celular conectado a la misma Wi-Fi antes de publicar,
usa la URL de red que muestra `npm run dev` (no `localhost`, que en el celular
apuntaría al propio teléfono). Para probar específicamente la configuración
final de Vercel, utiliza el enlace de producción.

## 7. Conectar un dominio propio después

1. Compra o selecciona el dominio que quieras usar.
2. En **Vercel → Project → Settings → Domains**, agrega el dominio y sigue las
   instrucciones DNS que Vercel muestre para tu proveedor de dominio.
3. Espera la verificación DNS y el certificado HTTPS de Vercel.
4. Actualiza `NEXT_PUBLIC_SITE_URL` en Production con la URL canónica nueva
   (por ejemplo, el dominio raíz o `www`, el que hayas elegido).
5. En **Environment Variables**, guarda el cambio y crea un nuevo despliegue.
6. Prueba el sitio, el detalle, WhatsApp, `/api/health`, `/robots.txt` y
   `/sitemap.xml` usando el dominio propio.

El proyecto ya genera metadatos Open Graph para el sitio y cada producto, tiene
favicon y crea un sitemap dinámico a partir de TiDB. `robots.txt` bloquea
`/admin` y `/api`.
