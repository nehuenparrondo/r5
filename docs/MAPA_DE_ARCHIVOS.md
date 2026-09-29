# Mapa de la entrega R5

## Backend

| Archivo                              | Responsabilidad                                                        |
| ------------------------------------ | ---------------------------------------------------------------------- |
| src/config/oauthProviders.ts         | Google, GitHub y Discord: endpoints, scopes y normalización            |
| src/config/env.ts                    | Variables OAuth junto a las variables originales                       |
| src/types/oauth.ts                   | Contratos de perfil, proveedor, transacción y errores                  |
| src/services/oauthService.ts         | URL de autorización, PKCE, state e intercambio de código por perfil    |
| src/services/oauthIdentityService.ts | Reglas de ingreso, registro y vinculación, independientes de MySQL     |
| src/models/oauthFlowModel.ts         | Persistencia temporal y consumo único del handshake                    |
| src/models/oauthAccountModel.ts      | Consultas parametrizadas, usuarios, vínculos y auditoría transaccional |
| src/controllers/oauthController.ts   | Inicio, callback, proveedores públicos y cuentas privadas              |
| src/routes/oauthRoutes.ts            | Rutas GET OAuth y POST de cuentas/vinculación                          |
| src/middlewares/oauthLinkGuard.ts    | Protección de la vinculación explícita                                 |
| src/middlewares/asyncHandler.ts      | Adaptador de promesas al errorHandler de Express 4                     |
| src/utils/authSession.ts             | Emisión compartida de la cookie JWT original                           |
| src/scripts/migrateOAuth.ts          | Migración incremental e idempotente de OAuth                           |
| src/scripts/initializeDatabase.ts    | Instalación idempotente del esquema al desplegar                       |
| database/oauth-migration.sql         | Nuevas tablas y password_hash nullable                                 |
| database/schema.sql                  | Esquema para instalación nueva                                         |
| database/least-privilege.sql         | Permisos mínimos de las tablas OAuth                                   |
| tests/oauthService.test.mjs          | Proveedores simulados, PKCE, state y validación                        |
| tests/oauthIdentity.test.mjs         | Creación y vinculación con repositorio simulado                        |
| tests/oauthHttp.test.mjs             | Flujos HTTP completos simulados y regresión de acceso local            |
| tests/setup.mjs                      | Variables falsas y aislamiento de datos reales                         |

## Ambas interfaces

Los mismos módulos existen en frontend-router/src y frontend-state/src, manteniendo las dos aplicaciones independientes:

| Archivo                       | Responsabilidad                                             |
| ----------------------------- | ----------------------------------------------------------- |
| services/oauth.ts             | Metadatos, cuentas propias y navegación OAuth               |
| components/SocialLogin.tsx    | Botones generados desde la lista del servidor e iconos      |
| components/OAuthFeedback.tsx  | Mensajes seguros y limpieza del parámetro error             |
| components/LinkedAccounts.tsx | Listado informativo de métodos vinculados                   |
| styles/oauth.css              | Diseño responsive y uso de las variables de tema existentes |
| types.ts                      | hasPassword, emailVerified y authProvider                   |
| services/api.ts               | API bajo /api, con las mismas operaciones existentes        |
| vite.config.ts                | Proxy de desarrollo al backend existente                    |

Se integran en LoginPage/RegisterPage/ProfilePage del router y AuthScreens/ProfileScreen de la versión por estado.

## Herramientas y documentación

- package.json: comandos comunes para lint, formato, tests y build.
- Dockerfile y railway.json: compilación y arranque reproducibles en producción.
- eslint.config.mjs: análisis de TypeScript y pruebas.
- .prettierrc.json y scripts/format.mjs: formato acotado a archivos de la entrega.
- README.md: puesta en marcha y acceso social.
- docs/OAUTH_CONFIGURACION_Y_PRUEBAS.md: configuración por consola, decisiones y pruebas manuales.
- docs/GUIA_LOGIN_GOOGLE_GITHUB.md: explicación completa del funcionamiento y archivos clave.
- docs/DESPLIEGUE_R5.md: variables, callbacks y publicación del sistema completo.
- docs/CUMPLIMIENTO_REQUERIMIENTOS.md: implementado frente a pendientes reales.
