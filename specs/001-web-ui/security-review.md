# Revisión de seguridad (T094)

**Fecha**: 2026-11-11 | **Rama**: `001-web-ui`

## Resultado

| Comprobación | Resultado |
|---|---|
| Secretos o claves en los archivos versionados | ✅ Ninguno. Las coincidencias de un barrido por patrones (`secret`, `password`, claves, tokens) son documentación, etiquetas de la interfaz y contraseñas de ejemplo (`123`, `12345678`) en pruebas y en el mock |
| Secretos en el historial (todas las ramas) | ✅ Ningún patrón de token de GitHub, clave de AWS, clave privada ni JWT en ningún commit |
| `.gitignore` | ✅ Cubre `node_modules/`, `dist/`, `.angular/`, `coverage/`, `.env` y `.claude/settings.local.json`; no hay archivos `.env`, `.pem`, `.pfx` ni credenciales versionados |
| `public/config.json` | ✅ Solo contiene la URL de la API |
| Clave JWT del backend en las pruebas con la API real | ✅ Generada al vuelo, solo en el entorno de ese proceso; no se escribió en ningún archivo |
| Endurecimiento de `src/` | ✅ `check:hardening` y ESLint: ni `localStorage`, `sessionStorage`, cookies, `innerHTML` ni `bypassSecurityTrust*` |
| El build de producción no contiene el mock | ✅ `check:prod` |
| Sesión | ✅ Token solo en memoria (prueba `no-storage.spec.ts`), cierre en el servidor, 401 tratado, `returnUrl` validado |
| `npm audit --omit=dev` | ⚠️ **11 avisos (4 altos, 7 moderados), 0 críticos** — ver abajo |

## `npm audit` y el riesgo residual aceptado

Los avisos afectan a `@angular/*` ≤ 19.2.25 y a `@ngrx/*` (que dependen de ellos). Ya estamos en la última versión publicada de la rama 19 (**19.2.25**): las correcciones solo existen en la rama 21 (`21.2.26`), un salto de dos versiones mayores que la constitución (principio I, Angular 19) no contempla en esta entrega. La tarea pedía «sin vulnerabilidades altas o críticas»; **no se cumple por completo**, y se documenta como riesgo residual con su análisis de aplicabilidad:

| Aviso (severidad) | ¿Se usa en esta aplicación? |
|---|---|
| Hidratación del cliente y `HttpTransferCache` (alta/moderada) | No: la aplicación no usa renderizado en servidor ni hidratación (`ng new --ssr=false`) |
| DoS en el SSR del router (alta) | No: no hay SSR |
| XSS de i18n por atributos de eventos (alta) | No: no se usa `@angular/localize` ni i18n; las etiquetas están en `labels.ts` |
| Elusión de saneamiento por enlaces bidireccionales o `host bindings` (moderada) | No: no se usan enlaces bidireccionales sobre propiedades saneadas ni `host bindings` con contenido del usuario; además `bypassSecurityTrust*` está prohibido por ESLint |
| DoS por memoria en `formatDate` (alta) | Exposición baja: se usa con un formato fijo (`dd/MM/yyyy HH:mm`) sobre fechas ISO que devuelve el backend propio, no sobre entrada libre del usuario |
| Fuga del token XSRF por discrepancia de análisis de URL (moderada) | No: la API usa JWT en la cabecera `Authorization`, sin cookies ni XSRF |

## Seguimiento

- Migrar a Angular 21 y NgRx 22 es un trabajo aparte (cambio de constitución, ADR, revisión de Material 21 y de las APIs). Queda propuesto como tarea de seguimiento.
- Mientras tanto, el CI no ejecuta `npm audit` como paso bloqueante para no fallar por avisos que solo se resuelven con esa migración.
