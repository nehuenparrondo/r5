# Login social: configuración y pruebas

## Alcance

El sistema permite iniciar sesión con Google, GitHub o Discord. Se conservan MySQL, Express,
TypeScript, la cookie JWT, el login local y las dos versiones del frontend. No se
ofrecen otros proveedores.

## Preparación

1. Usar Node.js 20 o superior y MySQL 8.
2. Instalar las dependencias desde la raíz con `npm install`.
3. Respaldar la base de datos y revisar `DB_NAME` en `backend/.env`.
4. Ejecutar `npm run migrate-oauth` dentro de `backend`.
5. Completar las variables OAuth indicadas en `backend/.env.example`.
6. Usar `API_PUBLIC_URL=http://localhost:3000` durante el desarrollo local.
7. Hacer coincidir `APP_URL` y `CORS_ORIGINS` con la dirección real del frontend.
8. No mezclar `localhost` y `127.0.0.1` durante un mismo intento OAuth.

## Google

1. Abrir Google Cloud Console y configurar Google Auth Platform.
2. Crear un cliente OAuth de tipo “Aplicación web”.
3. Registrar exactamente
   `http://localhost:3000/api/auth/oauth/google/callback`.
4. Completar `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_REDIRECT_URI`.
5. Agregar el usuario como usuario de prueba si la aplicación todavía está en pruebas.

El sistema solicita `openid email profile`, usa PKCE S256 y obtiene la identidad desde
el endpoint UserInfo de Google.

## GitHub

1. Abrir GitHub, Settings, Developer settings, OAuth Apps.
2. Crear una OAuth App.
3. Usar como callback
   `http://localhost:3000/api/auth/oauth/github/callback`.
4. Completar `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` y `GITHUB_REDIRECT_URI`.

El sistema solicita `read:user user:email`, usa PKCE S256 y consulta `/user/emails` para
obtener un correo verificado. No solicita acceso a repositorios.

## Discord

1. Abrir Discord Developer Portal y crear una aplicación.
2. En OAuth2, registrar exactamente
   `http://localhost:3000/api/auth/oauth/discord/callback`.
3. Completar `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` y `DISCORD_REDIRECT_URI`.

El sistema solicita solamente `identify email`, intercambia el código desde el backend por
`POST` y consulta `/users/@me`. No agrega bots ni solicita acceso a servidores.

## Comportamiento visible

- En Login y Registro aparecen los botones de Google, GitHub y Discord.
- En el perfil se muestran el proveedor usado para la sesión y las cuentas ya asociadas.
- El perfil no muestra botones para vincular proveedores.
- Si los proveedores entregan el mismo correo verificado, los accesos utilizan el mismo
  usuario local.
- Si el correo no es confiable o no coincide, el sistema no fusiona cuentas automáticamente.

## Pruebas manuales

1. Abrir Login y confirmar que aparecen Google, GitHub y Discord.
2. Entrar con Google y comprobar la llegada a `/perfil`.
3. Cerrar sesión y entrar con GitHub usando el mismo correo verificado.
4. Entrar con Discord y confirmar que “Cuentas vinculadas” enumera los proveedores usados.
5. Confirmar que no hay botones de
   vinculación.
6. Cerrar sesión y volver a entrar con cualquiera de los tres proveedores.
7. Cancelar un permiso y comprobar que aparece un mensaje legible.
8. Confirmar que la URL final no contiene tokens ni secretos.
9. Revisar que las cookies sean HttpOnly y que `auth_token` use SameSite Strict.
10. Probar también el login local, registro, perfil, logout y panel administrativo.

## Comandos de verificación

Desde la raíz:

```bash
npm run lint
npm run format:check
npm test
npm run build
```

Las pruebas automáticas simulan Google, GitHub, Discord y MySQL; no usan credenciales reales.
La explicación técnica completa está en `docs/GUIA_LOGIN_GOOGLE_GITHUB.md`.
