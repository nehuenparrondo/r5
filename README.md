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

R5 agrega **solo Google, GitHub y Facebook/Meta** en ambas interfaces. Mantiene MySQL,
TypeScript, usuarios, roles, auditoría y el login local existente. Facebook y Meta
son el mismo proveedor. No hay integración de Discord, Twitch ni X.

1. Instalar dependencias de herramientas en esta raíz con `npm install`.
2. Respaldar o clonar la base para R5; revisar `DB_NAME` en `backend/.env`.
3. Aplicar `npm run migrate-oauth` desde backend con permisos de migración.
4. Adaptar y aplicar `backend/database/least-privilege.sql` como administrador.
5. Crear las apps en Google Cloud Console, GitHub Developer Settings y Meta for Developers.
6. Copiar únicamente las nuevas variables de `backend/.env.example` al `.env` existente:
   `API_PUBLIC_URL`, `GOOGLE_CLIENT_ID/CLIENT_SECRET/REDIRECT_URI`,
   `GITHUB_CLIENT_ID/CLIENT_SECRET/REDIRECT_URI`,
   `FACEBOOK_CLIENT_ID/CLIENT_SECRET/REDIRECT_URI` y `FACEBOOK_GRAPH_VERSION`.
7. Registrar callbacks exactos:
   `http://localhost:3000/api/auth/oauth/google/callback`,
   `http://localhost:3000/api/auth/oauth/github/callback` y
   `http://localhost:3000/api/auth/oauth/facebook/callback`.

Los botones sin credenciales aparecen deshabilitados como “Sin configurar”.
La guía [Configuración y pruebas](docs/OAUTH_CONFIGURACION_Y_PRUEBAS.md) explica las tres
consolas, permisos, HTTPS, pruebas manuales y decisiones para la defensa oral.

Google/GitHub solo autovinculan cuando ambos lados verificaron el correo. Facebook
se vincula explícitamente desde el perfil; un usuario nuevo verifica su email con
el servicio de correo existente antes de ingresar. Los cambios de email también
requieren nueva verificación para evitar vinculaciones con una dirección ajena.

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

Ver también [Cumplimiento](docs/CUMPLIMIENTO_REQUERIMIENTOS.md) y
[Mapa de archivos](docs/MAPA_DE_ARCHIVOS.md).
