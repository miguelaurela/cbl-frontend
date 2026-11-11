# Resultados de la validación del quickstart (T095)

**Fecha**: 2026-11-11 | **Guía**: [quickstart.md](quickstart.md) | **Rama**: `001-web-ui`

Cómo se validó cada escenario:

- **Mock (navegador)**: `npm run start:mock`, recorrido real en el navegador integrado.
- **API real (navegador)**: `npm start` contra `cbl-backend` en local (`dotnet run`, EF InMemory, `Jwt__Key` temporal solo en el entorno del proceso, origen `http://localhost:4200`).
- **API real (HTTP)**: peticiones directas a la API real con el origen `http://localhost:4200` para comprobar el contrato que consume la interfaz.
- **Pruebas**: pruebas unitarias de Karma (relojes simulados con `fakeAsync` cuando hace falta).

El panel del navegador integrado estaba oculto durante parte de la sesión y Chrome ralentiza los temporizadores de una pestaña oculta (el mock usa `delay` de RxJS), por lo que los escenarios que no pudieron terminarse de forma fiable por interfaz se apoyan en las pruebas y se indican como tales.

| # | Escenario | Resultado | Cómo se comprobó |
|---|---|---|---|
| 1 | Login de cada rol | ✅ El prestamista llega a `/loans` y el administrador a `/admin/loans` | Mock (navegador) y API real (navegador) |
| 2 | Validación del acceso | ✅ Errores junto a cada campo (vacío y formato inválido) y no se envía | Mock (navegador) y pruebas |
| 3 | Credenciales incorrectas | ✅ Un único mensaje genérico, se queda en el acceso | Mock (navegador) y pruebas |
| 4 | Bloqueo (API) | ✅ Tras 5 fallos el sexto intento da 423 con `Retry-After: 900` (también con un correo inexistente) y la cabecera está expuesta por CORS; la interfaz muestra «Espera 14 min 56 s» | API real (HTTP), mock (navegador) y pruebas |
| 5 | Rutas protegidas | ✅ `/admin/loans` sin sesión redirige a `/login?returnUrl=%2Fadmin%2Floans` y tras iniciar sesión vuelve; un prestamista que abre `/admin/users` va a `/loans` con aviso | Mock (navegador) y pruebas de guards |
| 6 | Solicitar un préstamo | ✅ Confirmación, formulario limpio y préstamo Pendiente en «Mis préstamos» | Mock y API real (navegador) |
| 7 | Validación de la solicitud | ✅ 0, 999,99, 100.000,01, 3 decimales, plazo 0 y 61: error junto al campo y sin envío; los límites se ven como ayuda | Mock (navegador) y pruebas |
| 8 | Error del servidor por campo (API) | ✅ Tras cambiar los límites, un monto antiguo da 422 con `errors.amount` y la interfaz lo coloca junto al campo | API real (HTTP) y pruebas del formulario |
| 9 | Estados de la lista | ✅ Carga, vacío («Aún no tienes solicitudes») y error con «Reintentar» | Pruebas (el recorrido por interfaz del vacío no pudo completarse por la pestaña oculta) |
| 10 | Vista del administrador | ✅ Prestamista (nombre y correo), monto, plazo, estado, fechas y quién decidió, más recientes primero | Mock y API real (navegador) |
| 11 | Filtro y actualizar | ✅ Cada filtro muestra solo ese estado sin nueva petición; el contador de pendientes se mantiene; «Actualizar» recarga conservando el filtro | Mock (navegador) y pruebas |
| 12 | Aprobar | ✅ Diálogo con prestamista, monto y plazo; tras confirmar se refresca la lista y se ve quién y cuándo decidió; el contador baja | Mock y API real (navegador) |
| 13 | Doble clic | ✅ Tres pulsaciones seguidas abren un solo diálogo y se envía una sola decisión | Mock (navegador) y pruebas |
| 14 | Conflicto de decisión | ✅ La segunda decisión da 409 («El préstamo ya fue decidido…») y la interfaz avisa y refresca | API real (HTTP) y pruebas de efectos |
| 15 | Cerrar sesión | ✅ Vuelve al acceso con el aviso «Cerraste sesión»; «atrás» no muestra contenido privado; con la API real, el mismo token da 401 tras el logout (204) | Mock y API real (navegador/HTTP) y pruebas |
| 16 | Caducidad | ✅ A los 10 minutos se cierra la sesión con el aviso «Tu sesión expiró» | Pruebas con reloj simulado (`fakeAsync`) |
| 17 | Recarga | ✅ Recargar la página vuelve al acceso | Navegador |
| 18 | Sin almacenamiento | ✅ `localStorage`, `sessionStorage` y `document.cookie` vacíos tras iniciar sesión | Navegador y pruebas (`no-storage.spec.ts`) |
| 19 | Usuarios | ✅ Contraseña de 7 → error en el campo; de 8 → creado; correo duplicado → error junto al correo (también con otra capitalización); desactivar muestra «Desactivado» y el desactivado no inicia sesión | Mock (navegador), API real (HTTP) y pruebas |
| 20 | Propia cuenta | ✅ Rol y estado bloqueados con la explicación; el servidor responde 403 si se intenta | Mock (navegador), API real (HTTP) y pruebas |
| 21 | Límites | ✅ Se indica «Se aplica solo a las solicitudes nuevas»; el formulario del prestamista valida con los valores nuevos (ayuda «Entre $500.00 y $2,000.00») | Mock (navegador) y pruebas |
| 22 | Responsive y teclado | ✅ Sin desplazamiento horizontal a 360, 768, 1024 y 1280 px; foco visible; diálogos operables con el foco dentro; ver «Hallazgos corregidos» | Navegador |
| 23 | Errores inesperados | ✅ Mensaje genérico con «Código de referencia»; un 401 no lo muestra | Pruebas (el 500 del mock con `fail500@test.com` incluye `traceId`) |

## Criterios de éxito

SC-001 (acceso y solicitud en menos de 1 minuto): ✅ el recorrido completo en el navegador tardó unos segundos. SC-010 (historias P1 sin backend): ✅ las historias 1 a 7 se recorrieron en modo demostración. SC-003 (nueva decisión visible en menos de 2 segundos): ✅ con la API real y con el mock en primer plano el refresco llega tras una petición; en una pestaña oculta el mock puede tardar más por la limitación de temporizadores descrita arriba.

## Hallazgos corregidos durante la validación

- La etiqueta del rol y el enlace activo de la barra eran blancos sobre fondo claro (invisibles): ahora usan los colores del tema.
- El prefijo `$` se solapaba con la etiqueta «Monto»: la etiqueta queda flotante (`floatLabel="always"`).
- A 768 px la tabla de solicitudes (7 columnas) desbordaba horizontalmente: la tabla aparece desde 1024 px y por debajo se muestran tarjetas.
- El foco de teclado de los botones de Material era una capa tenue del 12 %: se añade un contorno de 3 px siempre visible.
