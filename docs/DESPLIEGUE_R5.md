# Despliegue completo de R5

## Arquitectura elegida

La publicación usa un único servicio web para Express y `frontend-router`, más una base MySQL.
El mismo dominio entrega la interfaz, la API y los callbacks OAuth. Esto conserva las cookies
HttpOnly y evita depender de cookies de terceros. `frontend-state` permanece completo, compilable
y disponible en el repositorio como la segunda implementación exigida.

## Servicios publicados

- Repositorio: `https://github.com/nehuenparrondo/r5`
- Aplicación Docker: Railway, servicio `R5`.
- Base de datos: MySQL administrado por Railway, servicio `MySQL`.
- Dominio público: `https://r5-production-96d2.up.railway.app`

Railway construye la imagen con el `Dockerfile`. El servicio web recibe las variables de conexión
mediante referencias privadas al servicio MySQL, sin copiar contraseñas al repositorio.

El `Dockerfile` compila backend y ambos frontends. En producción sirve `frontend-router` desde
Express. Antes de iniciar, `initializeDatabase.ts` crea las tablas y roles que falten sin borrar
datos existentes.

## Variables del servicio web

```env
NODE_ENV=production
JWT_SECRET=
JWT_EXPIRES_IN=15m
CORS_ORIGINS=https://r5-production-96d2.up.railway.app
APP_URL=https://r5-production-96d2.up.railway.app
API_PUBLIC_URL=https://r5-production-96d2.up.railway.app
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://r5-production-96d2.up.railway.app/api/auth/oauth/google/callback
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=https://r5-production-96d2.up.railway.app/api/auth/oauth/github/callback
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=https://r5-production-96d2.up.railway.app/api/auth/oauth/discord/callback
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=
MAILTRAP_PASS=
MAIL_FROM=Sistema Usuarios <no-reply@sistema-usuarios.local>
```

En Railway se configura `PORT=8080`. Las variables `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y
`DB_PASSWORD` referencian las variables privadas generadas por el servicio MySQL. El backend también
acepta `MYSQL_ADDON_*` para conservar portabilidad hacia otros proveedores MySQL.

`JWT_SECRET` debe ser aleatorio y tener al menos 32 caracteres. Los secretos reales solo van en
las variables privadas del servicio; nunca en GitHub.

## Callbacks de producción

Registrar en cada consola exactamente la URL correspondiente al dominio definitivo. Google admite
varios callbacks. Una OAuth App de GitHub admite una única callback, por lo que conviene crear una
aplicación separada para producción. Discord permite registrar el callback de producción junto al
local.

## Comprobación final

1. Abrir el dominio y confirmar que carga la pantalla de acceso.
2. Probar registro, verificación por email, login local y cierre de sesión.
3. Probar Google, GitHub y Discord.
4. Confirmar que `/perfil` se conserva al recargar.
5. Probar un usuario común y un administrador.
6. Verificar que no aparezcan secretos ni tokens en la URL o la consola.

La aplicación y MySQL están publicados en Railway. Google, GitHub y Discord tienen sus callbacks de
producción registrados. Los accesos reales con GitHub y Discord se completaron desde el dominio
público y quedaron vinculados al mismo usuario; Google ya estaba verificado en producción. Los
secretos solo se guardan en las variables privadas de Railway y nunca se documentan ni se suben a
GitHub.
