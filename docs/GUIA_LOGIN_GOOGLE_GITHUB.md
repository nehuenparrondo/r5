# Guía completa del acceso con Google, GitHub y Discord

## 1. Qué se agregó

El proyecto conserva el registro y el inicio de sesión por email o username. Sobre esa
base se agregó OAuth 2.0 para ingresar con Google, GitHub o Discord.

La integración funciona en las dos aplicaciones React:

- `frontend-router`: navegación con React Router.
- `frontend-state`: navegación controlada por estado.

Ambas usan el mismo backend, la misma base MySQL y la misma cookie de sesión.

## 2. Qué ve el usuario

Antes de iniciar sesión, las pantallas Login y Registro muestran tres alternativas:

- Continuar con Google.
- Continuar con GitHub.
- Continuar con Discord.

Después de iniciar sesión, el perfil muestra la sección “Cuentas vinculadas”. Esa sección
indica con qué proveedor se abrió la sesión y enumera las identidades sociales asociadas.
No muestra botones de vinculación: una vez autenticado, el perfil es únicamente informativo.

## 3. Recorrido completo de un inicio social

1. El frontend consulta `GET /api/auth/oauth/providers` para conocer los proveedores activos.
2. Al pulsar un proveedor, el navegador abre
   `GET /api/auth/oauth/:provider` en el backend.
3. El backend genera `state` y un secreto de navegador; también usa PKCE en proveedores compatibles.
4. En MySQL se guarda solo el hash de `state`, el hash del secreto y el verificador, con una
   caducidad de diez minutos.
5. El secreto del navegador viaja en una cookie temporal HttpOnly.
6. El usuario se autentica directamente en Google, GitHub o Discord.
7. El proveedor devuelve un código de autorización al callback del backend.
8. El backend consume la transacción una sola vez, valida la cookie, `state`, proveedor,
   vencimiento e issuer, y canjea el código por un access token.
9. Ese access token se usa inmediatamente para leer el perfil. No se guarda en la base.
10. El backend identifica o crea el usuario, registra la auditoría y emite la cookie local
    `auth_token`.
11. Finalmente, el navegador vuelve a `/perfil`.

## 4. Cómo se relacionan los proveedores y el usuario local

La tabla `users` sigue representando a las personas del sistema. Las identidades externas se
guardan en `oauth_accounts`, que contiene:

- El usuario local (`user_id`).
- El proveedor (`google`, `github` o `discord`).
- El identificador estable entregado por el proveedor (`provider_user_id`).
- El correo recibido del proveedor, solo como referencia.

La combinación proveedor + identificador externo es única. Esto evita que la misma cuenta
externa se asocie a dos usuarios locales.

Cuando una persona entra por primera vez:

- Si ya existe el vínculo exacto, se reutiliza ese usuario.
- Si no existe el vínculo, el backend busca un usuario con el mismo correo.
- La unión automática solo se permite si el proveedor confirma que el correo está verificado
  y el usuario local también tiene su correo verificado.
- Si no existe un usuario compatible, se crea uno nuevo con rol `user`.
- Si los proveedores usan el mismo correo verificado, quedan asociados al mismo usuario.

Las cuentas creadas por OAuth tienen `password_hash = NULL`. No se inventan contraseñas. El
login local continúa funcionando para las cuentas que sí tienen una contraseña guardada.

## 5. Diferencias entre proveedores

### Google

- Usa OpenID Connect sobre OAuth 2.0.
- Solicita `openid email profile`.
- Lee el perfil desde Google UserInfo.
- Usa el identificador `sub` como identidad estable.

### GitHub

- Usa una OAuth App.
- Solicita `read:user user:email`.
- Lee el usuario desde `/user` y los correos desde `/user/emails`.
- Prefiere el correo principal verificado; si no existe, usa otro correo verificado.
- No solicita permisos para repositorios.
- Valida el issuer `https://github.com/login/oauth` devuelto por GitHub.

### Discord

- Usa OAuth 2.0 Authorization Code desde el backend.
- Solicita únicamente `identify email`.
- Lee el perfil desde `/api/users/@me`.
- No agrega bots ni solicita acceso a servidores o mensajes.
- Solo considera confiable el correo cuando Discord devuelve `verified: true`.

## 6. Seguridad aplicada

- Authorization Code Flow: los secretos y el intercambio de tokens quedan en el backend.
- PKCE S256: vincula el código con el intento en Google y GitHub, que lo soportan en este flujo.
- `state` aleatorio: protege contra callbacks iniciados por terceros.
- Cookie temporal HttpOnly: liga el intento al mismo navegador.
- Consumo único en MySQL: un callback repetido no puede reutilizarse.
- Callback exacto: cada proveedor vuelve solamente a la URL registrada.
- Orígenes permitidos: el regreso al frontend se limita a `CORS_ORIGINS`.
- Timeout y límite de tamaño: las respuestas externas no pueden quedar esperando ni crecer
  sin control.
- Validación con Zod: los perfiles externos se aceptan solo con la forma esperada.
- Cookie local HttpOnly: JavaScript no puede leer el JWT de sesión.
- Auditoría: se guardan `oauth_register`, `oauth_link`, `oauth_login` y `oauth_failed`.
- Sin tokens externos persistidos: el access token se descarta al terminar el callback.

## 7. Archivos importantes del backend

- `backend/src/config/env.ts`: valida variables de entorno.
- `backend/src/config/oauthProviders.ts`: endpoints, permisos y normalización de los tres proveedores.
- `backend/src/services/oauthService.ts`: PKCE, `state`, URLs e intercambio por perfiles.
- `backend/src/controllers/oauthController.ts`: inicio, callback y respuesta al frontend.
- `backend/src/models/oauthFlowModel.ts`: transacciones OAuth temporales y de un solo uso.
- `backend/src/models/oauthAccountModel.ts`: usuarios, cuentas vinculadas y auditoría.
- `backend/src/services/oauthIdentityService.ts`: decide reutilizar, unir o crear un usuario.
- `backend/src/routes/oauthRoutes.ts`: expone las rutas bajo `/api/auth/oauth`.
- `backend/src/utils/authSession.ts`: crea la cookie JWT compartida con el login local.
- `backend/database/oauth-migration.sql`: agrega las tablas necesarias a una base existente.
- `backend/.env`: contiene credenciales reales y no debe subirse a Git.
- `backend/.env.example`: plantilla segura sin secretos.

## 8. Archivos importantes de los frontends

Los siguientes archivos existen tanto en `frontend-router/src` como en
`frontend-state/src`:

- `services/oauth.ts`: llamadas al backend y mensajes de error seguros.
- `components/SocialLogin.tsx`: botones Google/GitHub/Discord e iconos locales.
- `components/LinkedAccounts.tsx`: listado informativo de identidades asociadas.
- `components/OAuthFeedback.tsx`: transforma códigos de error en mensajes legibles.
- `styles/oauth.css`: aspecto responsive de botones y lista de cuentas.

## 9. Variables necesarias

El backend usa estas variables OAuth:

```env
API_PUBLIC_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/oauth/google/callback
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/oauth/github/callback
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/oauth/discord/callback
```

`APP_URL` debe apuntar al frontend que el usuario está utilizando. Ese mismo origen debe
estar incluido en `CORS_ORIGINS`.

## 10. Cómo iniciar el proyecto

Backend:

```bash
cd backend
npm run dev
```

Frontend Router:

```bash
cd frontend-router
npm run dev
```

Frontend State:

```bash
cd frontend-state
npm run dev
```

Solo debe existir un backend escuchando el puerto 3000. Si aparece `EADDRINUSE`, ya hay otro
proceso usando ese puerto y no debe iniciarse una segunda copia.

## 11. Base de datos y migración

La migración se ejecuta desde `backend`:

```bash
npm run migrate-oauth
```

Crea `oauth_accounts` y `oauth_flows`, permite `password_hash = NULL` para usuarios sociales
y conserva los usuarios, roles, perfiles, hashes y auditorías existentes. La migración es
idempotente, pero siempre conviene respaldar la base antes de aplicarla.

## 12. Verificación del trabajo

Desde la raíz del proyecto:

```bash
npm run lint
npm run format:check
npm test
npm run build
```

Las pruebas verifican proveedores disponibles, PKCE, callback, replay, cookies, creación y
reutilización de usuarios, cuentas vinculadas y regresiones del login local. Las APIs externas
se simulan en las pruebas; la comprobación final con credenciales reales se hace manualmente.

## 13. Problemas frecuentes

### El backend informa `EADDRINUSE`

Ya existe un backend en el puerto 3000. Usar el proceso existente o cerrarlo antes de iniciar
otro.

### El proveedor vuelve con error de configuración

Revisar que el callback de la consola coincida carácter por carácter con el indicado en
`backend/.env` y que `API_PUBLIC_URL` use el mismo host y puerto.

### La sesión vuelve al frontend equivocado

Revisar `APP_URL` y `CORS_ORIGINS`. Durante una prueba no alternar entre `localhost` y
`127.0.0.1`.

### GitHub no entrega un correo

La OAuth App debe solicitar `user:email`. El backend consulta `/user/emails` y requiere un
correo verificado para crear o unir automáticamente la cuenta.

### Discord no entrega un correo verificado

La aplicación debe solicitar `email`. El backend no fusiona una identidad si Discord no confirma
el correo; así evita tomar una cuenta por coincidencia no demostrada.

### Aparece un usuario duplicado

Comprobar que los correos de Google, GitHub, Discord y la cuenta local sean iguales y estén verificados.
La unión automática se rechaza deliberadamente cuando no se puede demostrar esa coincidencia.
