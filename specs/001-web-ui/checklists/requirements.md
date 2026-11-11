# Checklist de calidad de la especificación: Interfaz web

**Propósito**: validar que la especificación esté completa y con buena calidad antes de pasar a la planificación
**Creado**: 2026-11-11
**Funcionalidad**: [spec.md](../spec.md)

## Calidad del contenido

- [x] Sin detalles de implementación (lenguajes, frameworks, APIs)
- [x] Centrada en el valor para el usuario y las necesidades del negocio
- [x] Redactada para interesados no técnicos
- [x] Todas las secciones obligatorias completas

## Completitud de los requisitos

- [x] No quedan marcadores [NEEDS CLARIFICATION]
- [x] Los requisitos son comprobables y no ambiguos
- [x] Los criterios de éxito son medibles
- [x] Los criterios de éxito no dependen de la tecnología
- [x] Todos los escenarios de aceptación están definidos
- [x] Los casos límite están identificados
- [x] El alcance está claramente acotado
- [x] Las dependencias y los supuestos están identificados

## Preparación de la funcionalidad

- [x] Todos los requisitos funcionales tienen criterios de aceptación claros
- [x] Los escenarios de usuario cubren los flujos principales
- [x] La funcionalidad cumple los resultados medibles de los criterios de éxito
- [x] No se filtran detalles de implementación en la especificación

## Notas

- Validación en 1 iteración. Se mantienen términos del dominio que forman parte del comportamiento visible: los roles `Admin` y `Borrower`, las credenciales de ejemplo, el formato monetario `en-US` y la expresión "memoria" (la sesión no persiste), que describen qué experimenta el usuario y no cómo se construye. Las decisiones de stack (Angular, NgRx, Material, mock como configuración de build) pertenecen a `/speckit-plan` y ya están en la constitución.
- Supuestos añadidos que NO estaban en el prompt y conviene confirmar en `/speckit-clarify`: (1) Aprobar y Rechazar piden una confirmación breve; (2) un error genérico muestra el código de referencia del servidor si existe; (3) tras expirar la sesión se vuelve a la pantalla pedida al iniciar sesión de nuevo; (4) la interfaz no ofrece editar ni eliminar préstamos propios (lo soporta la API); (5) la pantalla de límites forma parte del alcance (historia 9, P2), aunque el prompt original solo mencionaba la de usuarios.
