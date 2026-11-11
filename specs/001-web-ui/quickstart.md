# Guía de validación (quickstart): interfaz web

**Rama**: `001-web-ui` | **Fecha**: 2026-11-11 | **Plan**: [plan.md](plan.md)

Guía para comprobar de extremo a extremo que la interfaz cumple la especificación. Es una guía de ejecución y validación: el
código y las pruebas completas pertenecen a `tasks.md` y a la implementación. Contrato: [contracts/openapi.yaml](contracts/openapi.yaml)
y [conciliación](contracts/reconciliation.md). Datos: [data-model.md](data-model.md).

## Requisitos previos

| Herramienta | Uso | Nota |
|---|---|---|
| Node.js 18.19.1 o superior (CI y `.nvmrc`: 22 LTS) | compilar y ejecutar | en esta máquina: 18.20.8 y 20.19.0 (`nvm use 20.19.0`) |
| npm 10 | dependencias | se usa `npm ci` con el `package-lock.json` |
| Google Chrome | pruebas con Karma (headless) y revisión manual | instalado |
| Backend `cbl-backend` | solo para el modo "API real" | no hace falta para el modo mock |

## 1. Instalar, probar y compilar

```powershell
npm ci
npm run lint
npm test                      # Karma + Jasmine, Chrome headless, sin modo watch
npm run build                 # build de producción en dist/
npm run build:mock            # build con el modo demostración
npm run contract:check        # tipos generados al día respecto a contracts/openapi.yaml
npm run contract:check-mock   # el mock implementa todas las operaciones del contrato
```

Resultado esperado: sin errores de lint, todas las pruebas en verde, los dos builds correctos y las dos comprobaciones del
contrato sin diferencias. El build de producción **no contiene** código del mock.

## 2. Ejecutar sin backend (modo demostración)

```powershell
npm run start:mock            # http://localhost:4200
```

Credenciales de ejemplo (**solo de ejemplo**): `usuario@test.com` (Prestamista) y `admin@test.com` (Administrador),
contraseña `123`. Se muestra un aviso "Modo demostración"; los datos viven en memoria y se pierden al recargar.

## 3. Ejecutar contra la API real

```powershell
# En cbl-backend (otra terminal): dotnet run --project src/CBL.Api   con Jwt__Key definida (ver su README)
npm start                     # http://localhost:4200, API en http://localhost:5000
```

La URL de la API sale de `public/config.json` (`apiBaseUrl`); el backend permite por defecto el origen `http://localhost:4200`.

## 4. Escenarios de validación

Cada escenario enlaza los requisitos o criterios que comprueba. Se ejecutan en modo mock y, los marcados con (API), también
contra la API real.

| # | Escenario | Pasos | Resultado esperado | Trazabilidad |
|---|---|---|---|---|
| 1 | Login de cada rol | Entrar con `usuario@test.com` y con `admin@test.com` | El prestamista llega a su vista; el administrador, a las solicitudes | FR-002 |
| 2 | Validación del acceso | Enviar con correo vacío, formato inválido o contraseña vacía | Errores junto a cada campo y no se envía | FR-001 |
| 3 | Credenciales incorrectas | Contraseña mala | Un único mensaje genérico en el formulario; no se cierra nada | FR-003 |
| 4 | Bloqueo (API) | 5 fallos con el mismo correo y un sexto intento | Mensaje de bloqueo con el tiempo de espera, también con un correo inexistente | FR-004 |
| 5 | Rutas protegidas | Abrir `/admin/loans` sin sesión; abrir una ruta de administración como prestamista | Redirige al acceso; al iniciar sesión vuelve a la pantalla pedida si el rol lo permite; el prestamista va a su vista con un aviso | FR-009, SC-002 |
| 6 | Solicitar un préstamo | Prestamista: monto 5.000 y plazo 12 | Confirmación, formulario limpio y préstamo Pendiente en "Mis préstamos" | FR-011, FR-012 |
| 7 | Validación de la solicitud | Monto 0, 999,99 o 100.000,01, con 3 decimales; plazo 0 y 61 | Error junto al campo y no se envía; los límites se ven como ayuda | FR-011 |
| 8 | Error del servidor por campo (API) | Cambiar los límites desde otra sesión y enviar un monto que ya no es válido | El 422 aparece junto al campo monto | FR-025, SC-005 |
| 9 | Estados de la lista | Cuenta sin préstamos; forzar error (modo mock: `fail500@test.com` en el login) | Lista vacía con invitación; error con "Reintentar"; carga con indicador | FR-013, FR-026, SC-006 |
| 10 | Vista del administrador | Entrar como administrador | Todas las solicitudes con prestamista, monto, plazo, estado y fechas, más recientes primero | FR-015 |
| 11 | Filtro y actualizar | Cambiar el filtro; crear una solicitud desde otra sesión y pulsar "Actualizar" | Muestra solo ese estado, con el contador de pendientes; la nueva solicitud aparece sin perder el filtro | FR-016, SC-013 |
| 12 | Aprobar | Aprobar una pendiente y confirmar | Diálogo de confirmación; la lista se recarga y muestra el estado, quién y cuándo | FR-017, SC-003 |
| 13 | Doble clic | Pulsar Aprobar dos veces rápido | Una sola decisión | FR-017, SC-009 |
| 14 | Conflicto de decisión | Decidir la misma solicitud desde dos pestañas | Mensaje de que ya fue decidida y lista refrescada | FR-018 |
| 15 | Cerrar sesión | Pulsar "Cerrar sesión" | Vuelve al acceso; la sesión se revoca en el servidor (API: el mismo token da 401) | FR-007 |
| 16 | Caducidad | Esperar 10 minutos (o simular el reloj en las pruebas) | Cierre automático con aviso "Tu sesión expiró" | FR-006, SC-004 |
| 17 | Recarga | Recargar la página con sesión | Vuelve al acceso (esperado) | FR-005 |
| 18 | Sin almacenamiento | Iniciar sesión y revisar el almacenamiento del navegador | Ningún dato de sesión en `localStorage`, `sessionStorage` ni cookies | FR-005, SC-008 |
| 19 | Usuarios | Crear un usuario con contraseña de 7 y de 8 caracteres; duplicar el correo; desactivar y reactivar | 7 → error en el campo; 8 → creado; duplicado → error en el correo; el desactivado no inicia sesión | FR-019, FR-021 |
| 20 | Propia cuenta | El administrador intenta desactivarse o cambiarse el rol | Controles bloqueados con una explicación | FR-020, SC-011 |
| 21 | Límites | Cambiar los límites y abrir el formulario de solicitud | Se indica "solo a solicitudes nuevas"; el formulario valida con los valores nuevos | FR-022, FR-023, SC-012 |
| 22 | Responsive y teclado | Revisar a 360, 768 y 1280 px; recorrer con el teclado | Sin desplazamiento horizontal; foco visible; diálogos operables | FR-026, SC-007 |
| 23 | Errores inesperados | Provocar un 500 | Mensaje genérico con el código de referencia | FR-025 |

## 5. Seguridad antes de subir

- Ningún secreto en el repositorio (el frontend no tiene claves; `config.json` solo contiene la URL de la API).
- La comprobación de endurecimiento del CI busca `localStorage`, `sessionStorage`, `innerHTML` y `bypassSecurityTrust*` en
  `src/` y rechaza el build si aparecen.
- Revisar `git diff --cached` de los archivos generados por Spec Kit y por los agentes antes de cada push.

## 6. Entrega

Un tag `v*.*.*` dispara `release.yml`, que adjunta a un GitHub Release el zip del build de producción y `SHA256SUMS.txt`. Para
publicarlo en cualquier servidor estático basta descomprimirlo y editar `config.json` con la URL de la API. No hay despliegue en
la nube.
