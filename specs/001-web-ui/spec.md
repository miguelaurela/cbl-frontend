# Especificación de funcionalidad: CBL Project (Control Banking Loans) – Interfaz web

**Rama de la funcionalidad**: `001-web-ui`

**Creada**: 2026-11-11

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Interfaz web del sistema de gestión de préstamos bancarios (simulación) con la que los prestamistas solicitan préstamos y consultan los suyos, y los administradores los revisan y los aprueban o rechazan, además de gestionar usuarios y los límites de monto. Consume la API REST del backend (`cbl-backend`) y debe poder demostrarse también sin backend."

## Actores

- **Prestamista (Borrower)**: cliente que solicita préstamos y consulta los suyos.
- **Administrador (Admin)**: revisa todas las solicitudes, decide sobre ellas, gestiona usuarios y gestiona los límites de monto.
- **Revisor**: persona que evalúa la prueba técnica y necesita ejecutar toda la interfaz sin tener el backend en marcha.

Existen exactamente dos roles de usuario (Admin y Borrower); todo usuario tiene uno y solo uno. El backend es la fuente de verdad de las reglas de negocio y siempre revalida la autorización: la interfaz solo las refleja para guiar al usuario.

## Clarifications

### Session 2026-11-11

Respondidas por el usuario (4):

- Q: ¿Se muestra al usuario el código de referencia (`traceId`) del servidor en los errores? → A: Sí, solo en los errores inesperados (fallos del servidor o errores no clasificados); los errores normales (validación, conflicto, acceso denegado) no lo muestran.
- Q: ¿Se vuelve a la pantalla pedida tras iniciar sesión después de una redirección o expiración? → A: Sí, a la pantalla pedida si el rol lo permite; si no, a la vista propia del rol.
- Q: ¿Cómo se entera el administrador de las solicitudes nuevas? → A: Botón "Actualizar" manual; la lista se carga al abrir, al cambiar el filtro y tras cada decisión, sin actualización periódica automática.
- Q: ¿Qué formato de fecha y hora se usa? → A: Día/mes/año con hora de 24 h (por ejemplo, 11/11/2026 17:30), en la zona horaria del navegador.

Resueltas con las decisiones ya registradas en el repositorio (5):

- Q: ¿Aprobar y Rechazar piden confirmación? → A: Sí, un diálogo de confirmación breve que muestra prestamista, monto y plazo (plan de tareas del frontend, FE-41).
- Q: ¿La interfaz ofrece editar o eliminar préstamos propios? → A: No; la API lo soporta, pero el contrato asumido por el frontend lo marca como "no usado por la interfaz".
- Q: ¿Está la pantalla de límites de monto en el alcance? → A: Sí, se construye después del MVP, junto a la de usuarios (ADR-0025 y FE-52).
- Q: ¿Qué ocurre cuando caduca la sesión? → A: Vuelve a la pantalla de acceso con un mensaje, sin aviso previo ni renovación (ADR-0013, ADR-0020).
- Q: ¿Qué requisitos de accesibilidad se cumplen? → A: Etiqueta en cada campo, foco visible, avisos anunciados a lectores de pantalla, diálogos operables con el teclado y estados que no dependen solo del color (plan de tareas, FE-70).

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia de usuario 1 – Iniciar sesión (Prioridad: P1)

Como prestamista o administrador, quiero iniciar sesión con mi correo y contraseña para acceder a las pantallas que corresponden a mi rol.

**Por qué esta prioridad**: sin sesión no hay ninguna otra función; todo es privado salvo esta pantalla.

**Prueba independiente**: iniciar sesión con las credenciales de ejemplo de cada rol y comprobar a qué pantalla llega cada uno; probar credenciales incorrectas, el bloqueo y el límite de solicitudes.

**Escenarios de aceptación**:

1. **Dado** un prestamista con credenciales válidas, **cuando** inicia sesión, **entonces** llega a su vista de prestamista (solicitar y ver sus préstamos).
2. **Dado** un administrador con credenciales válidas, **cuando** inicia sesión, **entonces** llega a la vista del administrador (solicitudes).
3. **Dado** el formulario de acceso, **cuando** el correo está vacío o no tiene formato válido, o la contraseña está vacía, **entonces** se muestra el error junto al campo y no se envía nada al servidor.
4. **Dado** credenciales incorrectas (o un usuario desactivado), **cuando** se envían, **entonces** se muestra un único mensaje genérico en el formulario que no revela si el correo existe, y el formulario queda listo para reintentar.
5. **Dado** un correo bloqueado por intentos fallidos, **cuando** se intenta iniciar sesión, **entonces** se informa del bloqueo y de cuánto tiempo falta (según lo que indica el servidor), sin revelar si el correo existe.
6. **Dado** que el servidor limita las solicitudes, **cuando** se supera ese límite, **entonces** se muestra un mensaje de espera con el tiempo indicado por el servidor.
7. **Dado** el envío en curso, **cuando** el usuario vuelve a pulsar el botón, **entonces** no se envía una segunda petición.

---

### Historia de usuario 2 – Mantener y cerrar la sesión de forma segura (Prioridad: P1)

Como prestamista o administrador, quiero que mi sesión se cierre cuando yo lo pida o cuando caduque, y que solo vea las pantallas de mi rol, para que mi cuenta esté protegida.

**Por qué esta prioridad**: es el comportamiento de seguridad central que exige la prueba (sesión limitada y rutas protegidas).

**Prueba independiente**: cerrar sesión manualmente, dejar caducar una sesión, recargar la página y abrir direcciones directas de otras áreas con y sin sesión y con cada rol.

**Escenarios de aceptación**:

1. **Dado** un usuario con sesión, **cuando** pulsa "Cerrar sesión", **entonces** la sesión termina también en el servidor, no queda ningún dato de sesión en el navegador y vuelve a la pantalla de acceso; **y** si el servidor no responde, la sesión local se cierra igualmente.
2. **Dado** una sesión de 10 minutos de vida, **cuando** pasa ese tiempo, **entonces** se cierra automáticamente, se informa de que la sesión expiró y se vuelve a la pantalla de acceso, sin necesidad de renovación.
3. **Dado** una sesión activa, **cuando** el usuario recarga la página o cierra y abre la pestaña, **entonces** debe iniciar sesión de nuevo (comportamiento esperado: la sesión vive solo en memoria).
4. **Dado** una petición autenticada que el servidor responde como no autenticada, **cuando** ocurre, **entonces** la sesión se cierra, se informa al usuario y se vuelve al acceso.
5. **Dado** un visitante sin sesión, **cuando** abre la dirección de cualquier pantalla privada, **entonces** es llevado a la pantalla de acceso y, tras iniciar sesión, llega a la pantalla que pedía si su rol lo permite.
6. **Dado** un prestamista, **cuando** abre una dirección del área de administración, **entonces** no ve su contenido y es llevado a su propia vista con un aviso; **y** un administrador no accede a la vista de prestamista.
7. **Dado** un usuario con sesión, **cuando** pulsa "atrás" después de cerrar sesión, **entonces** no puede volver a ver contenido privado.

---

### Historia de usuario 3 – Solicitar un préstamo (Prioridad: P1)

Como prestamista, quiero solicitar un préstamo indicando monto y plazo en meses para que sea evaluado.

**Por qué esta prioridad**: es la función central del negocio para el cliente.

**Prueba independiente**: con sesión de prestamista, enviar una solicitud válida y comprobar que aparece como Pendiente; probar valores inválidos y fuera de los límites.

**Escenarios de aceptación**:

1. **Dado** el formulario de solicitud, **cuando** el prestamista lo abre, **entonces** ve los límites de monto vigentes como ayuda y el plazo admitido (1 a 60 meses).
2. **Dado** un monto menor o igual que 0, con más de 2 decimales o fuera de los límites vigentes, **cuando** intenta enviar, **entonces** se muestra el error junto al campo monto y no se envía.
3. **Dado** un plazo que no es un entero entre 1 y 60, **cuando** intenta enviar, **entonces** se muestra el error junto al campo plazo y no se envía.
4. **Dado** una solicitud válida, **cuando** se envía, **entonces** se confirma el resultado, el formulario se limpia y el préstamo aparece en "Mis préstamos" como Pendiente.
5. **Dado** que el servidor rechaza la solicitud con errores por campo (por ejemplo, porque los límites cambiaron), **cuando** responde, **entonces** cada error se muestra junto a su campo.
6. **Dado** el envío en curso, **cuando** se vuelve a pulsar el botón, **entonces** no se envía una segunda solicitud.

---

### Historia de usuario 4 – Ver mis préstamos y su estado (Prioridad: P1)

Como prestamista, quiero ver la lista y el estado (Pendiente, Aprobado, Rechazado) de mis préstamos.

**Por qué esta prioridad**: cierra el ciclo para el cliente: solicitar y conocer el resultado.

**Prueba independiente**: con préstamos en los tres estados, comprobar que se ven solo los propios, con su estado, y los estados de carga, vacío y error.

**Escenarios de aceptación**:

1. **Dado** un prestamista con préstamos, **cuando** abre su vista, **entonces** ve únicamente los suyos, del más reciente al más antiguo, con monto en dólares, plazo, estado, fecha de solicitud y, si fue decidido, fecha de decisión.
2. **Dado** los tres estados, **cuando** se muestran, **entonces** cada uno se distingue visualmente (no solo por el color) y con su nombre en español.
3. **Dado** un prestamista sin préstamos, **cuando** abre la vista, **entonces** ve un mensaje de lista vacía que le invita a solicitar el primero.
4. **Dado** que la carga está en curso o falla, **cuando** ocurre, **entonces** ve un indicador de carga o un mensaje de error con un botón para reintentar.
5. **Dado** un préstamo que un administrador acaba de decidir, **cuando** el prestamista actualiza la vista, **entonces** ve el nuevo estado.

---

### Historia de usuario 5 – Ver todas las solicitudes (Prioridad: P1)

Como administrador, quiero ver todas las solicitudes con el prestamista, el monto y el estado, y filtrarlas por estado.

**Por qué esta prioridad**: es la base para que el administrador pueda decidir.

**Prueba independiente**: con préstamos de varios prestamistas, comprobar la lista completa, el filtro por estado y que un prestamista no puede acceder a esta vista.

**Escenarios de aceptación**:

1. **Dado** un administrador, **cuando** abre su vista, **entonces** ve las solicitudes con nombre y correo del prestamista, monto, plazo, estado, fecha de solicitud y, si fue decidida, quién decidió y cuándo; las más recientes primero.
2. **Dado** el filtro por estado (Todos, Pendiente, Aprobado, Rechazado), **cuando** el administrador lo cambia, **entonces** la lista muestra solo ese estado; por defecto se muestra Pendiente, con la cantidad de pendientes visible.
3. **Dado** un filtro sin resultados, **cuando** se aplica, **entonces** se muestra un mensaje de "no hay solicitudes con este filtro".
4. **Dado** la lista, **cuando** hay muchas solicitudes, **entonces** se muestran todas (sin paginación).
5. **Dado** que un prestamista creó una solicitud después de abrir la lista, **cuando** el administrador pulsa "Actualizar", **entonces** la lista se recarga desde el servidor, conserva el filtro elegido y muestra la solicitud nueva; la lista no se actualiza sola.
6. **Dado** una pantalla estrecha, **cuando** se abre esta vista, **entonces** las solicitudes se presentan en un formato legible sin desplazamiento horizontal.

---

### Historia de usuario 6 – Aprobar o rechazar una solicitud (Prioridad: P1)

Como administrador, quiero aprobar o rechazar una solicitud pendiente.

**Por qué esta prioridad**: es la otra mitad del flujo central del negocio.

**Prueba independiente**: decidir sobre una solicitud pendiente y comprobar el nuevo estado en la lista; intentar decidir una ya decidida.

**Escenarios de aceptación**:

1. **Dado** una solicitud Pendiente, **cuando** el administrador la aprueba o la rechaza, **entonces** la lista se actualiza desde el servidor y muestra el nuevo estado con quién decidió y cuándo.
2. **Dado** una solicitud ya Aprobada o Rechazada, **cuando** se muestra, **entonces** no ofrece acciones de decisión (la decisión es final).
3. **Dado** que la decisión está en curso, **cuando** el administrador vuelve a pulsar el botón, **entonces** se envía una sola decisión.
4. **Dado** que otro administrador decidió antes sobre la misma solicitud, **cuando** el servidor responde con conflicto, **entonces** se explica con un mensaje claro que ya fue decidida y la lista se refresca con el estado real.
5. **Dado** una acción irreversible, **cuando** el administrador pulsa Aprobar o Rechazar, **entonces** se le pide una confirmación breve antes de enviar la decisión.
6. **Dado** un fallo de red o del servidor, **cuando** ocurre al decidir, **entonces** se muestra un mensaje claro y la solicitud permanece como estaba.

---

### Historia de usuario 7 – Usar la aplicación sin backend (Prioridad: P1)

Como revisor, quiero ejecutar toda la interfaz sin tener el backend en marcha, con datos de ejemplo, para evaluarla de extremo a extremo.

**Por qué esta prioridad**: la prueba permite trabajar contra un contrato mientras no exista la API, y permite demostrar todo el flujo en cualquier máquina.

**Prueba independiente**: arrancar la aplicación en modo demostración y recorrer todas las historias P1 con las credenciales de ejemplo.

**Escenarios de aceptación**:

1. **Dado** el modo demostración, **cuando** se inicia, **entonces** la aplicación funciona sin backend con usuarios de ejemplo (`usuario@test.com` y `admin@test.com`, contraseña `123`, solo de ejemplo), límites de monto de 1.000 a 100.000 y préstamos en los tres estados.
2. **Dado** el modo demostración, **cuando** se usa, **entonces** se comporta como el servidor real: valida monto y plazo, solo decide sobre pendientes (la segunda decisión da conflicto), respeta los roles, bloquea el correo tras 5 intentos fallidos durante 15 minutos, caduca la sesión a los 10 minutos y simula el cierre de sesión.
3. **Dado** el modo demostración, **cuando** se está usando, **entonces** se indica con claridad que los datos son de ejemplo y se pierden al recargar la página.
4. **Dado** la versión de producción, **cuando** se compila, **entonces** el modo demostración no forma parte de ella.

---

### Historia de usuario 8 – Gestionar usuarios (Prioridad: P2)

Como administrador, quiero gestionar usuarios (crear, consultar, actualizar, desactivar y reactivar) desde una pantalla de usuarios.

**Por qué esta prioridad**: necesaria para operar el sistema sin registro público, pero el flujo central funciona con los usuarios de ejemplo.

**Prueba independiente**: crear un usuario, editarlo, desactivarlo y reactivarlo, y comprobar los errores por campo y las protecciones sobre la propia cuenta.

**Escenarios de aceptación**:

1. **Dado** un administrador, **cuando** abre la pantalla de usuarios, **entonces** ve la lista con nombre, correo, rol, estado (activo o desactivado) y fecha de creación; los desactivados se distinguen visualmente.
2. **Dado** el formulario de alta, **cuando** el correo no es válido, el nombre está vacío, la contraseña tiene menos de 8 caracteres o el rol no está elegido, **entonces** se muestra el error junto al campo.
3. **Dado** un correo que ya existe, **cuando** el servidor responde con conflicto, **entonces** el error se muestra junto al campo correo.
4. **Dado** un usuario existente, **cuando** el administrador cambia nombre, rol o estado, o restablece la contraseña (opcional, mínimo 8 caracteres), **entonces** los cambios se guardan y la lista se actualiza.
5. **Dado** el propio administrador, **cuando** ve su fila, **entonces** no puede desactivar su cuenta ni cambiar su rol (los controles están bloqueados con una explicación); **y** si el servidor lo rechazara, se muestra un mensaje claro.
6. **Dado** un prestamista, **cuando** abre la dirección de esta pantalla, **entonces** no accede.

---

### Historia de usuario 9 – Gestionar los límites de monto (Prioridad: P2)

Como administrador, quiero consultar y modificar los límites de monto de los préstamos.

**Por qué esta prioridad**: da flexibilidad al negocio sin redesplegar, pero el flujo central funciona con los límites por defecto.

**Prueba independiente**: modificar los límites y comprobar que el formulario de solicitud del prestamista usa los valores nuevos.

**Escenarios de aceptación**:

1. **Dado** un administrador, **cuando** abre la pantalla de límites, **entonces** ve el mínimo y el máximo vigentes.
2. **Dado** el formulario de límites, **cuando** el mínimo es menor o igual que 0, el máximo no es mayor que el mínimo o algún valor tiene más de 2 decimales, **entonces** se muestra el error junto al campo y no se envía.
3. **Dado** unos límites válidos, **cuando** se guardan, **entonces** se confirma el cambio y se indica que se aplica solo a las solicitudes nuevas.
4. **Dado** que el servidor rechaza los valores, **cuando** responde con errores por campo, **entonces** se muestran junto a cada campo.
5. **Dado** un cambio de límites, **cuando** un prestamista abre el formulario de solicitud después, **entonces** ve y valida con los límites nuevos.

---

### Casos límite

- La sesión caduca mientras el usuario rellena un formulario o con una acción en curso: se informa de que la sesión expiró y se vuelve al acceso sin perder el contexto de forma silenciosa.
- Un administrador decide sobre una solicitud que otro acaba de decidir: mensaje de conflicto y lista refrescada.
- Los límites cambian mientras el prestamista rellena el formulario: el servidor rechaza con error en el monto y se muestra junto al campo.
- Fallo de red o servidor no disponible: mensaje claro y reintento posible, nunca una pantalla en blanco.
- Un usuario es desactivado con la sesión abierta: conserva el acceso como máximo hasta que expire la sesión (comportamiento del servidor).
- Recarga de la página: se pierde la sesión (esperado) y se vuelve al acceso.
- Pulsar "atrás" tras cerrar sesión: no se ve contenido privado.
- Lista de solicitudes o de préstamos vacía, o filtro sin resultados: mensaje de lista vacía.
- Montos muy grandes o con 2 decimales: se muestran con formato monetario legible en dólares.
- Un prestamista crea una solicitud mientras el administrador tiene la lista abierta: no aparece hasta que el administrador pulsa "Actualizar", cambia el filtro o decide sobre otra.
- Pantallas estrechas (a partir de 360 px de ancho): todas las vistas son utilizables sin desplazamiento horizontal.
- Respuestas de error con formato inesperado o sin cuerpo: mensaje genérico según el código, sin mostrar detalles internos.
- Correo con otra capitalización al iniciar sesión: se trata como el mismo usuario (lo resuelve el servidor).

## Requisitos *(obligatorio)*

### Requisitos funcionales

**Acceso y sesión**

- **FR-001**: La aplicación MUST ofrecer una pantalla de acceso con correo y contraseña, con validaciones (ambos obligatorios, el correo con formato válido) y mensajes junto a cada campo.
- **FR-002**: Tras iniciar sesión, la aplicación MUST llevar al prestamista a su vista de prestamista y al administrador a su vista de administrador.
- **FR-003**: Ante credenciales incorrectas, la aplicación MUST mostrar un único mensaje genérico en el formulario, sin revelar si el correo existe y sin cerrar ninguna sesión ni redirigir.
- **FR-004**: Ante un correo bloqueado o un límite de solicitudes superado, la aplicación MUST mostrar un mensaje que indique cuánto tiempo hay que esperar, según lo que informa el servidor.
- **FR-005**: La sesión MUST vivir solo en memoria: no se guarda ningún dato de sesión en almacenamiento persistente del navegador, y recargar la página exige iniciar sesión de nuevo.
- **FR-006**: La sesión MUST caducar a los 10 minutos (según la expiración que informa el servidor), cerrarse automáticamente, avisar al usuario y volver al acceso. No hay renovación de sesión.
- **FR-007**: Todas las pantallas autenticadas MUST ofrecer "Cerrar sesión"; esta MUST terminar la sesión en el servidor y localmente, y cerrar la sesión local aunque el servidor no responda.
- **FR-008**: Cuando una petición autenticada sea respondida como no autenticada, la aplicación MUST cerrar la sesión, informar al usuario y volver al acceso; el 401 del propio inicio de sesión MUST tratarse como error del formulario.
- **FR-009**: Las pantallas privadas MUST estar protegidas: sin sesión se redirige al acceso (y tras iniciar sesión se vuelve a la pantalla pedida si el rol lo permite); con un rol no permitido se redirige a la vista propia con un aviso.
- **FR-010**: La interfaz MUST distinguir exactamente dos roles, mostrados como Prestamista y Administrador.

**Prestamista**

- **FR-011**: El formulario de solicitud MUST pedir monto y plazo y validar: monto mayor que 0, con 2 decimales como máximo y dentro de los límites vigentes (obtenidos del servidor y mostrados como ayuda); plazo entero de 1 a 60 meses. El servidor sigue siendo la autoridad.
- **FR-012**: Tras una solicitud correcta, la aplicación MUST confirmar el resultado, limpiar el formulario y mostrar el préstamo como Pendiente en "Mis préstamos".
- **FR-013**: "Mis préstamos" MUST mostrar solo los préstamos del usuario, del más reciente al más antiguo, con monto, plazo, estado, fecha de solicitud y fecha de decisión.
- **FR-014**: Los tres estados (Pendiente, Aprobado, Rechazado) MUST distinguirse visualmente de forma que no dependa solo del color y mostrarse con su nombre en español.

**Administrador**

- **FR-015**: La vista del administrador MUST listar todas las solicitudes con prestamista (nombre y correo), monto, plazo, estado, fecha de solicitud y, si fue decidida, quién decidió y cuándo; las más recientes primero, sin paginación.
- **FR-016**: La lista MUST poder filtrarse por estado (Todos, Pendiente, Aprobado, Rechazado), con Pendiente por defecto y la cantidad de pendientes visible. La lista MUST ofrecer un botón "Actualizar" que la recarga desde el servidor conservando el filtro; no se actualiza sola de forma periódica.
- **FR-017**: Las acciones Aprobar y Rechazar MUST estar disponibles solo en solicitudes Pendientes, pedir una confirmación breve, enviarse una sola vez aunque se pulse repetidamente y, al terminar, refrescar la lista desde el servidor.
- **FR-018**: Ante un conflicto de decisión (otra persona decidió antes), la aplicación MUST explicarlo con un mensaje claro y refrescar la lista con el estado real.

**Usuarios (administrador)**

- **FR-019**: La pantalla de usuarios MUST permitir listar, crear, actualizar, desactivar y reactivar usuarios, con validaciones (correo válido, nombre obligatorio, contraseña de al menos 8 caracteres al crear o al restablecer, rol elegido) y errores del servidor junto a cada campo; un correo duplicado se muestra junto al campo correo.
- **FR-020**: La interfaz MUST impedir que un administrador desactive su propia cuenta o cambie su propio rol, explicando el motivo; si el servidor lo rechazara, MUST mostrar un mensaje claro.
- **FR-021**: Los usuarios desactivados MUST distinguirse visualmente de los activos.

**Límites de monto (administrador)**

- **FR-022**: La pantalla de límites MUST mostrar el mínimo y el máximo vigentes y permitir modificarlos, validando que el mínimo sea mayor que 0, el máximo mayor que el mínimo y ambos con 2 decimales como máximo; tras guardar MUST indicar que el cambio se aplica solo a las solicitudes nuevas.
- **FR-023**: El formulario de solicitud del prestamista MUST usar siempre los límites vigentes más recientes obtenidos del servidor.

**Transversales**

- **FR-024**: Todas las etiquetas y mensajes de la interfaz MUST estar en español; los importes en dólares estadounidenses con formato `en-US`; las fechas y horas con formato día/mes/año y hora de 24 h (por ejemplo, 11/11/2026 17:30) en la zona horaria del navegador.
- **FR-025**: Los errores del servidor MUST mostrarse así: errores de validación junto a su campo (o como mensaje si no hay campo); acceso denegado, no encontrado y conflicto como mensaje claro; bloqueo y límite de solicitudes con el tiempo de espera; fallos de red u otros errores como mensaje genérico, sin detalles internos. Solo los errores inesperados incluyen el código de referencia (`traceId`) del servidor, cuando existe, para que el usuario lo cite a soporte; los demás errores no lo muestran.
- **FR-026**: Todas las vistas MUST mostrar estados de carga, de error (con opción de reintentar) y de lista vacía, y MUST ser utilizables desde 360 px de ancho y con el teclado, con etiqueta visible en cada campo, foco visible, avisos anunciados a lectores de pantalla, diálogos operables con el teclado y estados que no dependan solo del color.
- **FR-027**: Cualquier texto que provenga del servidor MUST mostrarse como texto, nunca interpretado como contenido ejecutable.

**Modo demostración (sin backend)**

- **FR-028**: La aplicación MUST poder ejecutarse en un modo demostración sin backend, con las mismas pantallas, usuarios y límites de ejemplo (`usuario@test.com` y `admin@test.com`, contraseña `123`; límites 1.000–100.000) y préstamos de ejemplo en los tres estados.
- **FR-029**: El modo demostración MUST reproducir el comportamiento del servidor: las mismas validaciones, los mismos códigos de error (acceso denegado, conflicto en la segunda decisión, bloqueo tras 5 intentos fallidos durante 15 minutos, no autenticado), la caducidad de la sesión a los 10 minutos y el cierre de sesión.
- **FR-030**: El modo demostración MUST indicar claramente que los datos son de ejemplo y que se pierden al recargar, y MUST quedar fuera de la versión de producción.

### Entidades clave

- **Sesión**: usuario autenticado en la aplicación. Atributos: identificador, correo, nombre, rol y momento de expiración; vive solo en memoria.
- **Préstamo**: solicitud de un prestamista. Atributos: prestamista (nombre y correo), monto, plazo en meses, estado, fecha de solicitud, y datos de la decisión (quién y cuándo) cuando existe.
- **Usuario**: persona con acceso. Atributos: nombre, correo, rol, estado activo o desactivado, fecha de creación.
- **Límites de monto**: mínimo y máximo vigentes para solicitar préstamos.
- **Error de la API**: respuesta de error del servidor con título, estado, detalle, errores por campo y código de referencia.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **SC-001**: Un prestamista puede iniciar sesión y enviar una solicitud válida en menos de 1 minuto.
- **SC-002**: El 100 % de los intentos de abrir pantallas privadas sin sesión, o pantallas de otro rol, terminan en una redirección sin mostrar su contenido.
- **SC-003**: Tras aprobar o rechazar, el administrador ve el nuevo estado en la lista en menos de 2 segundos y sin recargar la página.
- **SC-004**: La sesión se cierra automáticamente a los 10 minutos en el 100 % de los casos y el usuario llega al acceso con un aviso.
- **SC-005**: El 100 % de los errores de validación del servidor aparecen junto al campo correspondiente o, si no hay campo, como mensaje claro.
- **SC-006**: El 100 % de las vistas muestra estados de carga, de error y de lista vacía.
- **SC-007**: Todas las pantallas son utilizables a 360 px de ancho sin desplazamiento horizontal.
- **SC-008**: No queda ningún dato de sesión en el almacenamiento persistente del navegador en ningún momento.
- **SC-009**: Pulsar varias veces seguidas Aprobar o Rechazar produce una sola decisión en el servidor.
- **SC-010**: En modo demostración se pueden recorrer de extremo a extremo todas las historias P1 sin backend.
- **SC-011**: El 100 % de los intentos de un administrador por desactivar su cuenta o cambiar su rol desde la interfaz quedan bloqueados.
- **SC-012**: Tras cambiar los límites, la siguiente vez que un prestamista abre el formulario valida con los valores nuevos.
- **SC-013**: El administrador ve las solicitudes creadas después de abrir la lista con una sola pulsación de "Actualizar", sin recargar la página y sin perder el filtro.

## Supuestos

- La interfaz consume la API REST del backend (`cbl-backend`); el contrato es su OpenAPI y el backend es la fuente de verdad de las reglas de negocio y de la autorización.
- La sesión dura 10 minutos y no se renueva: es el comportamiento del servidor. Perder la sesión al recargar es un compromiso asumido por seguridad.
- La lista de solicitudes del administrador no se pagina (el volumen es pequeño) y se muestra con el filtro Pendiente por defecto.
- Editar y eliminar préstamos propios está soportado por la API, pero la interfaz no lo ofrece en esta versión (la prueba exige solicitar, consultar y decidir).
- Tras un cierre de sesión por expiración o por 401, el usuario vuelve a la pantalla de acceso con un aviso; no hay aviso previo a la expiración ni renovación (supuesto por defecto, no confirmado por el usuario).
- No hay actualización periódica automática de las listas: se actualizan al abrir, al cambiar el filtro, tras cada acción y con el botón "Actualizar" (decisión del usuario).
- Los montos están en una única moneda (USD); no hay conversión.
- El contrato con el backend ya incluye el cierre de sesión en el servidor, el bloqueo con tiempo de espera y el límite de solicitudes; el modo demostración los reproduce.
- Dependencia: el backend publicado (o el modo demostración) debe estar disponible para ejecutar la aplicación de extremo a extremo.

## Fuera de alcance

- Edición y eliminación de préstamos desde la interfaz.
- Registro público de usuarios, recuperación de contraseña y notificaciones.
- Cálculo de intereses, cuotas, desembolsos y pagos.
- Consulta del historial de auditoría de decisiones.
- Renovación o persistencia de sesión (refresh token, "recordarme").
- Otros idiomas distintos del español y paginación de listas.
