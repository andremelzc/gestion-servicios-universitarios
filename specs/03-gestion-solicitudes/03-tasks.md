# Tareas 03 — Gestión de Solicitudes

> Tareas de planificación: **TASK-009** (workflow), **TASK-010** (endpoints), **TASK-011** (bandeja FE), **TASK-034** (cierre), **TASK-035** (comentarios). Marcar `[x]` solo al cumplir la [DoD](../../docs/04-gestion/equipo-y-flujo-de-trabajo.md#4-definición-de-hecho-dod).

## Fase 1 — Núcleo del workflow (BE) · R2

| ☐ | # | Tarea | US | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---|
| [ ] | 1.1 | `Transicion` (enum con origen, destino y roles) según la [matriz oficial](../../docs/02-diseno/arquitectura-tecnica.md#22-matriz-de-transiciones-y-permisos) | US-08…11 | Revisión contra la matriz |
| [ ] | 1.2 | `AccessPolicy` (ver/ejecutar/`accionesPermitidas`) | RN-16 | `AccessPolicyTest` |
| [ ] | 1.3 | `SolicitudWorkflowService.ejecutar` (404/403/409/400 y atajo de ADR-003) | US-08 | CA-2, CA-12 |
| [ ] | 1.4 | `HistorialService` (solo inserción); los triggers de BD ya impiden `UPDATE`/`DELETE` | US-11 | CA-13 (prueba SQL) |
| [ ] | 1.5 | Pruebas de las transiciones inválidas más comunes contra la matriz | RN-06 | `TransicionesInvalidasTest` |

## Fase 2 — Endpoints de transición (BE) · R2

| ☐ | # | Tarea | US | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---|
| [ ] | 2.1 | `PUT …/asignar` (asignar y reasignar; valida técnico activo del área) | US-08 | CA-1, CA-4, CA-8 |
| [ ] | 2.2 | `PUT …/iniciar-atencion` | US-09 | CA-9 |
| [ ] | 2.3 | `PUT …/resolver` (multipart: informe + 1–3 evidencias) | US-10 | CA-10, CA-11 |
| [ ] | 2.4 | `GET /solicitudes` (bandeja con `Specification`, alcance por rol, `vencida`) y `GET …/historial` | RF-12 | CA-16 |
| [ ] | 2.5 | `GET /usuarios/tecnicos` con área forzada para supervisor | US-08 | CA-17 |
| [ ] | 2.6 | `PUT …/evaluar` (cambio de prioridad y recálculo de SLA) | US-23 | CA-6 |
| [ ] | 2.7 | `PUT …/cerrar` | US-25 | CA-14 |
| [ ] | 2.8 | Anotaciones `@PreAuthorize` y `@Operation` (OpenAPI) en cada endpoint | todos | CA-3, CA-5 |

## Fase 3 — Comentarios (BE) · R3

| ☐ | # | Tarea | US | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---|
| [ ] | 3.1 | `ComentarioService` y endpoints `GET/POST …/comentarios` con visibilidad por rol | US-27 | CA-18, CA-19 |

## Fase 4 — Frontend · R5 (apoyo R4)

| ☐ | # | Tarea | US | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---|
| [ ] | 4.1 | `BandejaSupervisorPage` con filtros, pestañas, indicador de SLA accesible | US-08 | UAT-04 |
| [ ] | 4.2 | `BandejaTecnicoPage` (móvil primero) | US-09 | UAT-05 |
| [ ] | 4.3 | `ModalAsignacion` (técnicos con su carga) | US-08 | CA-1 |
| [ ] | 4.4 | `ModalResolucion` con `FileUploader` (evidencia obligatoria) | US-10 | CA-10, CA-11 |
| [ ] | 4.5 | `ModalCierre` (confirmación de cierre) | US-25 | UAT-06 |
| [ ] | 4.6 | `LineaTiempoHistorial` y `AccionesSolicitud` (según `accionesPermitidas`) | US-11 | CA-13 |
| [ ] | 4.7 | `ComentariosPanel` con opción de privado para roles internos | US-27 | CA-18 |

## Fase 5 — Calidad · R6

| ☐ | # | Tarea | Evidencia |
|:-:|:-:|:---|:---|
| [ ] | 5.1 | Suite de autorización completa del módulo (rol × endpoint × propio/ajeno/otra área) | TC-016, 019, 023 |
| [ ] | 5.2 | Colección Bruno `03-gestion` con el flujo `registro → asignar → iniciar → resolver → cerrar` | Reporte en el PR |
| [ ] | 5.3 | Métrica de negocio `solicitudes_transiciones_total` y `solicitudes_transicion_invalida_total` | [Observabilidad §4.2](../../docs/03-calidad-y-operacion/observabilidad.md#42-de-negocio-personalizadas) |
| [ ] | 5.4 | Registrar en el [Registro de IA](../../docs/04-gestion/ia-register.md) todo uso de IA en este módulo (especialmente pruebas generadas) | Entradas con validación |
