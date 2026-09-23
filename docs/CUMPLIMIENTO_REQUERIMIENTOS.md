# Cumplimiento R5

## Implementado

- [x] Base existente conservada y trabajo limitado a la copia de r5 react.
- [x] MySQL conservado por confirmación expresa del usuario.
- [x] Solo Google, GitHub y Facebook/Meta, sin otros proveedores.
- [x] Configuración declarativa, servicio y controlador comunes.
- [x] Authorization Code Flow servidor-servidor; sin secretos en frontend.
- [x] State aleatorio, cookie HttpOnly, caducidad y consumo único transaccional.
- [x] PKCE S256 en Google/GitHub; no se presupone soporte en Facebook.
- [x] Validación de callbacks, destinos y perfiles; límites de tiempo y rate limiting.
- [x] Auto-vinculación solo con email verificado en ambos lados.
- [x] Vinculación explícita desde una sesión local y verificación por correo para Facebook nuevo.
- [x] Nuevos usuarios con rol user y sin contraseña inventada.
- [x] Cookie JWT original compartida por login local/social.
- [x] Login local protegido frente a hashes NULL de usuarios sociales.
- [x] Cuentas vinculadas y proveedor de la sesión en ambos perfiles.
- [x] Botones separados del formulario, iconos y estilos claros/oscuros.
- [x] Migración MySQL, esquema completo, índices y permisos mínimos.
- [x] Auditoría oauth_login/oauth_register/oauth_link; sin access tokens almacenados.
- [x] Documentación, mapa, .env.example y pruebas sin red de proveedores.
- [x] TypeScript, lint y pruebas automatizadas verificados.
- [x] Builds de ambas interfaces verificados con esbuild WASM por restricciones del entorno.

## Pendiente de configuración/prueba externa

- [ ] Aplicar la migración en una copia MySQL de R5 y otorgar permisos.
- [ ] Registrar las tres apps y cargar sus credenciales en backend/.env.
- [ ] Completar los recorridos reales con Google, GitHub y Facebook.
- [ ] Validar entrega de correo para verificación de Facebook y cambios de email.
- [ ] Completar commits con el nombre y email del autor.

No se marca como probado un acceso real que requiere cuentas o credenciales que no están disponibles.
Los comandos normales de test/build encontraron spawn EPERM en este entorno; se ejecutaron comprobaciones equivalentes en un único proceso.
