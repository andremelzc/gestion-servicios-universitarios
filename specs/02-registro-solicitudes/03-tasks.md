# Tareas 02 — Registro y Seguimiento de Solicitudes

> Tareas de planificación: **TASK-006** (entidades/DTO), **TASK-007** (endpoint de alta), **TASK-008** (frontend). Marcar `[x]` solo al cumplir la [DoD](../../docs/04-gestion/equipo-y-flujo-de-trabajo.md#4-definición-de-hecho-dod).

## Fase 1 — Modelo y DTO (BE) · R2

| ☐ | # | Tarea | US | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---|
| [ ] | 1.1 | Entidades `Solicitud`, `Categoria`, `Prioridad`, `EstadoSolicitud`, `Evidencia`, `HistorialSolicitud` (LAZY, `ddl-auto=validate`) | US-05 | Arranque contra Flyway |
| [ ] | 1.2 | DTO `record` con Bean Validation y `@SinHtml` (longitudes de [API §3.2](../../docs/02-diseno/api-rest.md#32-solicitudes--solicitudes)) | US-05 | CA-3, CA-6 |
| [ ] | 1.3 | Repositorios, `SolicitudSpecification` y proyecciones DTO | US-21 | Sin N+1 (log de SQL) |
| [ ] | 1.4 | `SlaCalculator` (función pura con `Clock`) | US-05 | `SlaCalculatorTest` (CA-10) |

## Fase 2 — Código y evidencias (BE) · R2

| ☐ | # | Tarea | US | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---|
| [ ] | 2.1 | `CodigoSolicitudService` (incremento atómico de la secuencia anual) | US-07 | `CodigoSolicitudServiceTest` (CA-9) |
| [ ] | 2.2 | `FileTypeValidator` (firma, extensión, tipo, tamaño) | US-06 | `FileTypeValidatorTest` con `.exe` renombrado (CA-5) |
| [ ] | 2.3 | `FileStorageService` (UUID, ruta fuera del *webroot*, compensación al fallar la transacción) | US-06 | `FileStorageServiceTest`, CA-15 |
| [ ] | 2.4 | `SolicitudService.crear` transaccional (algoritmo del plan §1.2) y registro de historial | US-05/07 | CA-1, CA-2, CA-15 |

## Fase 3 — Endpoints (BE) · R2

| ☐ | # | Tarea | US | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---|
| [ ] | 3.1 | `POST /solicitudes` multipart (partes `solicitud`/`archivos`), `Location` en el 201 | US-05 | `SolicitudControllerTest` |
| [ ] | 3.2 | `GET /solicitudes/mis-solicitudes` (filtros y paginación) | US-21 | CA-11 |
| [ ] | 3.3 | `GET /solicitudes/{id}`, `/historial` y descarga de evidencia, con `AccessPolicy` (404 si ajena) | US-21 | CA-12, CA-13 |
| [ ] | 3.4 | `GET /categorias` y `GET /prioridades` (activas) para el formulario (coordinar con módulo 05) | US-05 | CA-8 |
| [ ] | 3.5 | Configuración de límites multipart y de Nginx (`client_max_body_size`) | US-06 | CA-4 |

## Fase 4 — Frontend · R4

| ☐ | # | Tarea | US | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---|
| [ ] | 4.1 | `NuevaSolicitudPage` con Zod, contador, borrador en `sessionStorage` y `FormData` | US-05 | UAT-02 |
| [ ] | 4.2 | `FileUploader` (drag & drop, vista previa, límites 5 MB / 3 archivos) | US-06 | `FileUploader.test` (CA-4) |
| [ ] | 4.3 | Pantalla de confirmación con el código | US-07 | CA-1 |
| [ ] | 4.4 | `MisSolicitudesPage` (tabla/tarjetas, filtros con *debounce*, paginación, estado vacío) | US-21 | CA-11 |
| [ ] | 4.5 | `SolicitudDetallePage` con `Timeline` y evidencias | US-21 | CA-13 |
| [ ] | 4.6 | `EstadoBadge` y `PrioridadTag` accesibles (texto + icono + color) | US-21 | Revisión manual de accesibilidad |

## Fase 5 — Calidad · R6

| ☐ | # | Tarea | Evidencia |
|:-:|:-:|:---|:---|
| [ ] | 5.1 | Pruebas de integración de alta (éxito y rollback) con Testcontainers | TC-007, 008, 013 |
| [ ] | 5.2 | Pruebas de seguridad: HTML, `.exe` renombrado, archivo > 5 MB, IDOR | TC-009, 010, 011, 023 |
| [ ] | 5.3 | Colección Bruno `02-registro` y ejecución en CI | Reporte en el PR |
| [ ] | 5.4 | Escenario k6 de creación de solicitud (con y sin evidencia) | RNF-02 |
| [ ] | 5.5 | Registrar en el [Registro de IA](../../docs/04-gestion/ia-register.md) todo uso de IA en este módulo | Entradas con validación |
