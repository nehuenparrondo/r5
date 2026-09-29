# Despliegue completo de R5

## Arquitectura elegida

La publicación usa un único servicio web para Express y `frontend-router`, más una base MySQL.
El mismo dominio entrega la interfaz, la API y los callbacks OAuth. Esto conserva las cookies
HttpOnly y evita depender de cookies de terceros. `frontend-state` permanece completo, compilable
y disponible en el repositorio como la segunda implementación exigida.

## Servicios

1. Subir este repositorio a GitHub.
2. Crear un proyecto en Railway desde el repositorio.
3. Agregar un servicio MySQL al mismo proyecto.
4. Exponer un dominio público HTTPS para el servicio web.
5. Conectar al servicio web las variables MySQL proporcionadas por Railway.

El `Dockerfile` compila backend y ambos frontends. En producción sirve `frontend-router` desde
Express. Antes de iniciar, `initializeDatabase.ts` crea las tablas y roles que falten sin borrar
datos existentes.

## Variables del servicio web

```env
NODE_ENV=production
PORT=3000
DB_HOST=
DB_PORT=3306
DB_NAME=
DB_USER=
DB_PASSWORD=
JWT_SECRET=
JWT_EXPIRES_IN=15m
CORS_ORIGINS=https://DOMINIO_PUBLICO
APP_URL=https://DOMINIO_PUBLICO
API_PUBLIC_URL=https://DOMINIO_PUBLICO
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://DOMINIO_PUBLICO/api/auth/oauth/google/callback
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=https://DOMINIO_PUBLICO/api/auth/oauth/github/callback
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=https://DOMINIO_PUBLICO/api/auth/oauth/discord/callback
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=
MAILTRAP_PASS=
MAIL_FROM=Sistema Usuarios <no-reply@sistema-usuarios.local>
```

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

La publicación real necesita acceso a las cuentas de GitHub, Railway, Google, GitHub OAuth,
Discord Developer Portal y al servicio SMTP. No se deben inventar esas credenciales.
