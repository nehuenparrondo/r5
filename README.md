# Sistema de Usuarios — React + TypeScript + Express + MySQL

Proyecto completo para la consigna de sistema de usuarios con dos front-ends:

- `frontend-router`: navegación con React Router.
- `frontend-state`: navegación de pantallas usando `useState`.
- `backend`: API Node.js + Express + TypeScript + MySQL.
- `backend/database/schema.sql`: esquema relacional en 3FN.

## Requisitos

- Node.js 20+.
- MySQL 8+.
- npm.

## 1. Base de datos

Crear una base vacía y ejecutar:

```bash
mysql -u root -p < backend/database/schema.sql
```

El script crea la base `sistema_usuarios`, las tablas, índices y roles `user/admin`.

## 2. Back-end

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Editar `.env` antes de iniciar. La aplicación NO debe conectarse a MySQL como `root`.

Para crear el primer administrador:

```bash
npm run create-admin -- admin@ejemplo.com AdminSeguro_123! administrador
```

Si un administrador olvida su contraseña, primero compilar el backend y ejecutar el restablecimiento
desde una consola conectada a la base correspondiente:

```bash
npm run build
npm run reset-admin-password -- admin@ejemplo.com
```

El comando verifica que el email pertenezca a un usuario con rol `admin` y solicita dos veces la
nueva contraseña sin mostrarla en pantalla. En Railway se ejecuta desde la consola del servicio web,
donde ya están disponibles las variables privadas de MySQL.

## 3. Front-end con React Router

```bash
cd frontend-router
npm install
npm run dev
```

## 4. Front-end con useState

```bash
cd frontend-state
npm install
npm run dev
```

Ambos front-ends usan `http://localhost:5173` por defecto, por lo que conviene ejecutar uno a la vez. Si se ejecutan simultáneamente, Vite asignará otro puerto y ese origen deberá agregarse a `CORS_ORIGINS`.

## Decisiones de seguridad

- Contraseñas: `bcrypt` con factor de costo 12. Nunca se almacenan contraseñas en texto plano.
- Autenticación: JWT con expiración corta, guardado en cookie `httpOnly`; el token no se guarda en `localStorage`.
- `localStorage`: se usa únicamente para preferencias no sensibles, como tema claro/oscuro y última pantalla.
- Cookies: `httpOnly`, `SameSite=Strict` y `Secure` en producción.
- SQL: todas las consultas con placeholders `?`.
- Duplicados: email y username se normalizan con `trim().toLowerCase()` antes de consultar/guardar y además tienen `UNIQUE`.
- Roles: el rol se toma de la base/JWT validado en el servidor; el registro público siempre crea `user`.
- Admin: nunca recibe `password_hash`.
- Perfil: el `user_id` sale del JWT. No se acepta un ID de usuario desde el front para editar el perfil propio.
- Rate limit: login y registro están limitados.
- HTTP: `helmet`, CORS limitado, cuerpo JSON acotado y errores centralizados.
- Auditoría: intentos fallidos de login, cambio de contraseña y acciones administrativas.
- Producción: debe usarse HTTPS y `NODE_ENV=production`.

## Modelo relacional y 3FN

### 1FN

Cada campo contiene un único valor atómico. No hay listas de roles, emails o perfiles dentro de una misma columna.

### 2FN

Todas las tablas usan una clave primaria simple. Cada atributo no clave depende completamente de su clave primaria.

### 3FN

Los roles están separados en `roles`, los datos de autenticación en `users`, el perfil en `user_profiles` y los eventos en `audit_logs`. No se repite el nombre del rol dentro de cada usuario ni se guardan datos derivados que dependan de otros atributos no clave.

## Endpoints

Los endpoints originales usan `POST`, incluso las operaciones de lectura. R5 agrega los `GET` de OAuth porque el proveedor necesita redirecciones reales.

- `POST /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/me`
- `POST /api/profile/update`
- `POST /api/profile/change-password`
- `POST /api/admin/users`

## Casos a probar

1. Registro correcto.
2. Email repetido con mayúsculas o espacios.
3. Username repetido con mayúsculas o espacios.
4. Contraseña débil.
5. Login incorrecto.
6. Bloqueo por exceso de intentos.
7. Acceso a perfil sin sesión.
8. Cambio de contraseña con contraseña actual incorrecta.
9. Usuario normal intentando entrar a administración.
10. Admin listando usuarios sin recibir hashes.
11. Tema claro/oscuro persistente.
12. Diseño en mobile, tablet y desktop.

## Login social (OAuth 2.0)

R5 agrega acceso con **Google, GitHub y Discord** en ambas interfaces. Mantiene MySQL,
TypeScript, usuarios, roles, auditoría y el login local existente.

1. Instalar dependencias desde esta raíz con `npm install`.
2. Respaldar la base y revisar `DB_NAME` en `backend/.env`.
3. Aplicar `npm run migrate-oauth` desde `backend` con permisos de migración.
4. Crear las aplicaciones en Google Cloud Console, GitHub Developer Settings y Discord Developer Portal.
5. Completar las variables de los tres proveedores indicadas en `backend/.env.example`.
6. Registrar estos callbacks exactos:
   `http://localhost:3000/api/auth/oauth/google/callback`,
   `http://localhost:3000/api/auth/oauth/github/callback`,
   `http://localhost:3000/api/auth/oauth/discord/callback`.

Antes de iniciar sesión se muestran los botones Google, GitHub y Discord. En el perfil no se
muestran botones de vinculación: “Cuentas vinculadas” solo enumera los proveedores
asociados al usuario.

Los proveedores se vinculan automáticamente a una cuenta existente únicamente cuando
el proveedor confirma el correo y coincide con el correo local verificado. Así una
persona puede entrar por cualquiera de los dos métodos sin crear usuarios duplicados.

Se reutiliza `auth_token` HttpOnly; no se inventa una infraestructura de refresh
tokens o sesiones que esta base no tenía. Las nuevas cuentas sociales tienen
`password_hash = NULL`. Nunca se guardan access tokens externos.

Rutas nuevas:

- `GET /api/auth/oauth/providers`: disponibilidad pública, sin credenciales.
- `GET /api/auth/oauth/:provider`: inicio con redirección.
- `GET /api/auth/oauth/:provider/callback`: state de un solo uso y sesión.
- `POST /api/auth/oauth/accounts`: cuentas del usuario autenticado.
- `POST /api/auth/oauth/:provider/link`: vinculación explícita protegida.

Desde la raíz, ejecutar `npm run lint`, `npm run format`, `npm run format:check`,
`npm test` y `npm run build`. Las pruebas simulan MySQL y las APIs externas;
las credenciales reales y la prueba manual en cada proveedor siguen siendo necesarias.

La [guía completa](docs/GUIA_LOGIN_GOOGLE_GITHUB.md) explica el flujo, la vinculación,
la base de datos, los archivos importantes y la puesta en marcha. Ver también
[Configuración y pruebas](docs/OAUTH_CONFIGURACION_Y_PRUEBAS.md),
[Despliegue](docs/DESPLIEGUE_R5.md),
[Cumplimiento](docs/CUMPLIMIENTO_REQUERIMIENTOS.md) y
[Mapa de archivos](docs/MAPA_DE_ARCHIVOS.md).
