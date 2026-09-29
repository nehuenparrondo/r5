# Cumplimiento R5

## Implementado

- [x] Base existente conservada y trabajo limitado a la copia de r5 react.
- [x] MySQL conservado por confirmación expresa del usuario.
- [x] Google, GitHub y Discord integrados en el mismo módulo.
- [x] Configuración declarativa, servicio y controlador comunes.
- [x] Authorization Code Flow servidor-servidor; sin secretos en frontend.
- [x] State aleatorio, cookie HttpOnly, caducidad y consumo único transaccional.
- [x] PKCE S256 en Google y GitHub; Discord protegido con state, cookie HttpOnly y secreto backend.
- [x] Validación de callbacks, destinos y perfiles; límites de tiempo y rate limiting.
- [x] Vinculación automática únicamente con correos verificados en ambos lados.
- [x] Nuevos usuarios con rol user y sin contraseña inventada.
- [x] Cookie JWT original compartida por login local/social.
- [x] Login local protegido frente a hashes NULL de usuarios sociales.
- [x] Cuentas vinculadas y proveedor de sesión visibles sin botones de vinculación en el perfil.
- [x] Botones separados del formulario, iconos y estilos claros/oscuros.
- [x] Migración MySQL, esquema completo, índices y permisos mínimos.
- [x] Auditoría oauth_login/oauth_register/oauth_link; sin access tokens almacenados.
- [x] Documentación, mapa, .env.example y pruebas sin red de proveedores.
- [x] TypeScript, lint y pruebas automatizadas verificados.
- [x] Builds de ambas interfaces verificados.
- [x] Dockerfile de producción y preparación para backend, frontend y MySQL en Railway.

## Pendiente de configuración/prueba externa

- [x] Aplicar el esquema automáticamente en la base MySQL de producción.
- [x] Registrar Google y GitHub y cargar sus credenciales en backend/.env.
- [x] Completar los recorridos reales con Google y GitHub.
- [x] Crear la aplicación Discord, registrar el callback local y cargar sus credenciales privadas.
- [x] Agregar el callback y las variables Discord del dominio definitivo de producción.
- [x] Crear el servicio y la base MySQL de producción, configurar variables y publicar el dominio.
- [ ] Validar entrega de correo para cambios de email.
- [ ] Completar commits con el nombre y email del autor.

La aplicación y MySQL están activos en Railway en `https://r5-production-96d2.up.railway.app`; la API
respondió correctamente por `POST /api/health`. Los callbacks de Google, GitHub y Discord están
registrados. GitHub y Discord se probaron de punta a punta en producción y quedaron vinculados al
mismo usuario; Google ya estaba comprobado en producción.
