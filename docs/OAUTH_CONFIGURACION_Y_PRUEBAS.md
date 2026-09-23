# Login social: configuración y pruebas manuales

## Alcance real

Solo Google, GitHub y Facebook/Meta, conforme a la aclaración del usuario.
Se conserva MySQL, TypeScript, Express 4, ambos frontends y la cookie JWT original.
El proyecto no tenía PostgreSQL, refresh tokens, user_sessions, CSRF por token, Alert ni herramientas de lint/test.
Se reutilizan StatusMessage, validadores, auditoría, cookies y limitadores existentes.
No se agregan Discord, Twitch, X, desvinculado ni cambio del motor de base de datos.

## Preparación

1. Usar Node.js 20 o superior y MySQL 8. Instalar dependencias en la raíz y en backend, frontend-router y frontend-state.
2. Respaldar la base antes de migrar. Para conservar también la base de R3 intacta, trabajar con una copia MySQL para R5 y ajustar DB_NAME en backend/.env. No apuntar inadvertidamente a la base original.
3. Si falta la verificación de email de la entrega anterior, aplicar su migración antes de OAuth. La migración OAuth presupone esas columnas.
4. En backend ejecutar `npm run migrate-oauth` con un usuario de migración que tenga permisos CREATE/ALTER/INDEX/REFERENCES. Es idempotente y conserva datos y hashes.
5. Un administrador debe adaptar y ejecutar backend/database/least-privilege.sql para la base y el usuario reales. La cuenta de ejecución no necesita permisos DDL.
6. Conservar JWT_SECRET y la configuración existente. Agregar al .env las variables OAuth de .env.example. Las variables nunca deben llevar prefijo VITE_.
7. Para desarrollo, API_PUBLIC_URL=http://localhost:3000 y APP_URL=http://localhost:5173. Si se usan ambos frontends, incluir los orígenes exactos en CORS_ORIGINS.
8. Vite reenvía /api al backend de localhost:3000. Si se cambia el puerto de la API, ajustar el proxy de ambos vite.config.ts.
9. Iniciar backend y uno o ambos frontends. Las credenciales faltantes deshabilitan únicamente el proveedor correspondiente.
10. Producción: HTTPS, NODE_ENV=production y proxy de /api bajo el mismo host público del frontend. Configurar API_PUBLIC_URL y las URLs registradas con ese host HTTPS.

No hace falta borrar la copia existente, reinstalar usuarios ni regenerar sus contraseñas.
El .env heredado no fue sobrescrito. No se aplicó automáticamente ninguna migración a la base compartida con R3.

## Google

- En [Google Cloud Console](https://console.cloud.google.com/), configurar Google Auth Platform: Branding, Audience y Data Access. Para una app de pruebas, agregar los usuarios de prueba.
- Crear un cliente OAuth de tipo aplicación web.
- Registrar exactamente: http://localhost:3000/api/auth/oauth/google/callback
- Completar GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URI.
- Solicitar únicamente openid email profile. Se envía PKCE S256.
- Probar usuario nuevo, usuario previamente vinculado, cancelación y cuenta local con email verificado coincidente.
- No se interpreta un ID token sin verificar: la identidad se obtiene del endpoint UserInfo por conexión servidor-servidor con el access token.

Referencia: [OpenID Connect de Google](https://developers.google.com/identity/openid-connect/openid-connect).

## GitHub

- En [Developer settings / OAuth Apps](https://github.com/settings/developers), crear una OAuth App.
- Homepage URL: http://localhost:5173
- Authorization callback URL: http://localhost:3000/api/auth/oauth/github/callback
- Completar GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET y GITHUB_REDIRECT_URI.
- Se solicitan read:user y user:email con PKCE S256; no se piden permisos de repositorios.
- Probar con el email público oculto. El servidor consulta /user/emails y selecciona un correo verificado, preferentemente el principal.
- Si no existe correo verificado, el registro se rechaza; un usuario ya autenticado puede vincular explícitamente desde su perfil.

Referencia: [Autorización de OAuth Apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps).

## Facebook / Meta

- En [Meta for Developers](https://developers.facebook.com/apps/), crear una app con el caso de uso Facebook Login y configurar el acceso web.
- Activar Client OAuth Login/Web OAuth Login y registrar el callback exacto en Valid OAuth Redirect URIs.
- Callback local previsto: http://localhost:3000/api/auth/oauth/facebook/callback. Si la consola exige HTTPS, usar un dominio HTTPS de desarrollo que reenvíe /api y actualizar API_PUBLIC_URL, FACEBOOK_REDIRECT_URI, APP_URL y CORS_ORIGINS de manera consistente.
- Completar FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET y FACEBOOK_REDIRECT_URI.
- FACEBOOK_GRAPH_VERSION queda fijado a v23.0, configurable; confirmar en la consola que esa versión esté habilitada para la app antes de probar. No depender de una versión implícita.
- En modo desarrollo, ingresar con un administrador/desarrollador/tester autorizado de la app. Para usuarios externos, completar los requisitos y permisos que indique la consola antes de publicarla.
- Se solicitan public_profile y email. Si no se concede email, primero ingresar por un método local y vincular Facebook desde el perfil.
- Facebook no entrega un email_verified en el perfil usado aquí. El campo verified no demuestra propiedad del correo.
- Cuenta nueva: enviar verificación usando el servicio de correo existente, abrir el enlace y volver a ingresar con Facebook. No hay sesión antes de verificar.
- Cuenta local existente: iniciar sesión por el método habitual y pulsar Vincular Facebook. Nunca se autovincula por un correo no verificado.
- PKCE no se activa en Facebook Login web porque no se asume soporte no documentado. Se mantienen state de un solo uso, secreto de cliente y callback exacto.

Referencias para revisar en la consola: [flujo manual de Facebook Login](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/) y [referencia User](https://developers.facebook.com/docs/graph-api/reference/user/).
Estas páginas de Meta no pudieron consultarse automáticamente durante la implementación; la configuración real debe confirmarse en la consola.

## Correo y métodos locales

El proyecto ya usa Mailtrap. Configurar MAILTRAP_USER, MAILTRAP_PASS y el resto de variables existentes para registros no verificados.
En un sandbox Mailtrap los mensajes se consultan allí; para correo real debe configurarse el transporte correspondiente.
Las nuevas cuentas sociales tienen password_hash NULL: no se inventan contraseñas y el formulario de cambio de contraseña no se ofrece a esas cuentas.
Las cuentas locales conservan su hash, rol y login por contraseña. La vinculación no cambia estos datos.
Al cambiar el email del perfil se invalida su verificación y se envía un nuevo enlace. Es necesario para no fusionar una identidad OAuth con un correo que el usuario nunca demostró poseer.
Un registro local pendiente tampoco se fusiona automáticamente: se pide resolver primero el método habitual.

## Matriz de prueba manual por proveedor

Ejecutar por separado para Google, GitHub y Facebook en ambos frontends:

1. Sin sesión, abrir Login y Registro: exactamente tres opciones sociales, separadas del formulario.
2. Iniciar con un usuario nuevo, aceptar permisos y completar verificación local si corresponde. Confirmar llegada a /perfil.
3. Salir y volver a entrar con el mismo proveedor: mismo ID local y ningún duplicado.
4. Probar email coincidente con una cuenta local verificada: Google/GitHub vinculan solo si confirman el correo. Facebook requiere vinculación explícita.
5. Probar una cuenta local todavía sin verificar: no debe fusionarse automáticamente.
6. Cancelar permisos: mensaje legible, sin sesión nueva.
7. Repetir el callback, quitar state, modificarlo o abrirlo desde otro navegador: rechazo sin emitir JWT.
8. Denegar email, ocultar email de GitHub, cambiar el email del proveedor, simular proveedor no disponible.
9. Revisar cookies: auth_token HttpOnly, SameSite=Strict y Secure en producción. Cookie temporal OAuth HttpOnly/SameSite=Lax y eliminada al finalizar.
10. Confirmar que la URL final y el JSON no contienen access_token, refresh_token ni client_secret.
11. Revisar oauth_accounts y auditoría: oauth_register/oauth_link/oauth_login; sin tokens externos persistidos.
12. Perfil: proveedor actual, cuentas vinculadas y vinculación explícita. Otro usuario no puede apropiarse de un vínculo.
13. Login local correcto/incorrecto, registro y verificación, edición del perfil, cambio de contraseña local, logout y panel admin.
14. Temas claro/oscuro a 375, 768 y 1440 px; teclado, foco visible y botones sin desbordamiento.

## Pruebas automáticas y límites

Desde la raíz: `npm run lint`, `npm run format`, `npm run format:check`, `npm test` y `npm run build`.
Las pruebas usan servidor HTTP real con MySQL y proveedores simulados; no envían credenciales ni correo reales.
Incluyen tres recorridos de inicio/callback/sesión, PKCE, state, replay, normalización, vinculación y regresión del login local.
No sustituyen una prueba con las apps reales ni una migración sobre una base MySQL de ensayo.
En entornos Windows restringidos se usa `--test-isolation=none` para evitar el error `spawn EPERM`; `npm test` ya aplica esa opción.
Los builds de ambas interfaces se verificaron usando el mismo esbuild 0.25.12 en WebAssembly dentro del proceso por esa restricción; los comandos normales del proyecto siguen usando Vite/esbuild nativos.

## Decisiones para la defensa oral

- Un registro de configuración describe cada proveedor; el controlador nunca contiene un flujo distinto por red.
- OAuth 2.0 delega acceso. La identidad se obtiene del perfil autenticado del proveedor; Google ofrece UserInfo mediante OIDC.
- oauth_accounts separa usuarios de identidades externas. La clave (provider, provider_user_id) impide duplicados y evita añadir columnas por cada red.
- Una columna google_id no viola por sí sola 1FN si es escalar; el problema práctico es el modelo repetitivo por proveedor y su escasa extensibilidad. La tabla relacionada expresa mejor la relación 1:N.
- Los tokens externos solo viven durante el callback y se descartan. No se requieren refresh tokens del proveedor para iniciar una sesión local.
- Se reutiliza la única cookie JWT existente. No se afirma que el sistema tenga refresh tokens, user_sessions ni una infraestructura CSRF que no existían.
- state es aleatorio; su hash identifica una fila corta y ligada a una cookie de navegador independiente. La fila se bloquea y elimina en una transacción antes del intercambio. Evita replay entre procesos.
- PKCE liga el código al intento que lo creó. Se usa S256 en Google y GitHub.
- La vinculación explícita exige una sesión, origen autorizado y JSON, además del handshake OAuth.
- Los nuevos usuarios siempre reciben el rol user. El rol de un usuario vinculado se conserva desde la base.
- El auditado se guarda en la misma transacción que las cuentas. Las restricciones UNIQUE y los reintentos acotados cubren carreras.
- No se implementa desvincular, por lo que no es posible quitar el último método desde esta entrega. No se registran eventos oauth_unlink ficticios.
