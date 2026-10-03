# Tareas 05 — Administración

> Tarea de planificación: **TASK-018** (BE + FE; R3 y R5). Los catálogos básicos se **siembran** en `V2` desde el MVP; este módulo agrega su mantenimiento. Marcar `[x]` solo al cumplir la [DoD](../../docs/04-gestion/equipo-y-flujo-de-trabajo.md#4-definición-de-hecho-dod).

## Fase 1 — Catálogos (BE) · R3

| ☐ | # | Tarea | US | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---|
| [ ] | 1.1 | Entidades y repositorios de `Area`, `Categoria`, `Prioridad`, `EstadoSolicitud` con `findAllByActivoTrue` | US-15…33 | Arranque contra Flyway |
| [ ] | 1.2 | `CategoriaService` (alta/edición/baja lógica/reactivar; unicidad; área activa; SLA ≥ 1) | US-15/16 | CA-1…CA-4 |
| [ ] | 1.3 | `AreaService` (con regla "no desactivar con usuarios activos") | US-33 | CA-5 |
| [ ] | 1.4 | `PrioridadService` (SLA no retroactivo) | US-31 | CA-6 |
| [ ] | 1.5 | `EstadoService` (solo presentación; validación de color) | US-32 | CA-7 |
| [ ] | 1.6 | Controladores `Area`, `Categoria`, `Prioridad`, `Estado` (lectura abierta a autenticados / escritura `ADMIN`), con OpenAPI | todos | CA-13 |

## Fase 2 — Usuarios y roles (BE) · R3

| ☐ | # | Tarea | US | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---|
| [ ] | 2.1 | `AdminUsuarioService` (alta, edición, rol/área con RN-21, baja lógica, reactivar) | US-17/34 | CA-8, CA-9, CA-10 |
| [ ] | 2.2 | Protecciones: último admin activo y no auto-desactivación | US-34 | CA-11 |
| [ ] | 2.3 | `AdminUsuariosController` (listado paginado con filtros `rol`, `idArea`, `activo`, `q`) y `RolController` | US-34 | `AdminUsuariosControllerTest` |
| [ ] | 2.4 | `GET /usuarios/tecnicos` (si no se hizo en el módulo 03) | US-08 | CA-17 del spec 03 |
| [ ] | 2.5 | Logs de auditoría de administración (cambios de rol/estado) | — | Revisión de logs |

## Fase 3 — Frontend · R5 (apoyo R4)

| ☐ | # | Tarea | US | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---|
| [ ] | 3.1 | `useCrud` genérico (paginación, búsqueda con *debounce*, errores por campo) | todos | `useCrud.test` |
| [ ] | 3.2 | `AdminLayout`, rutas `/admin/*` con `RoleRoute(['ADMIN'])` y menú | RBAC | CA-13 |
| [ ] | 3.3 | `DataTable` (tabla/tarjetas), filtro "Mostrar inactivas" y paginación | todos | CA-14 |
| [ ] | 3.4 | Pantallas y modales de **Categorías** y **Áreas** | US-15/16/33 | UAT-09 |
| [ ] | 3.5 | Pantalla y modal de **Prioridades** (SLA) | US-31 | CA-6 |
| [ ] | 3.6 | Pantalla de **Estados** (solo edición de presentación, con aviso de contraste) | US-32 | CA-7 |
| [ ] | 3.7 | Pantalla de **Usuarios** (filtros, alta, edición, desactivar/reactivar; área condicional) | US-17/34 | CA-8…CA-11 |
| [ ] | 3.8 | `ConfirmDialog` accesible (sin `window.confirm`) | todos | CA-14 |
| [ ] | 3.9 | Refrescar caché de catálogos tras los cambios (formulario de solicitud y dashboard) | RF-09 | CA-1 (se ve de inmediato) |

## Fase 4 — Calidad · R6

| ☐ | # | Tarea | Evidencia |
|:-:|:-:|:---|:---|
| [ ] | 4.1 | Prueba de baja lógica: la categoría inactiva desaparece del formulario pero sigue en el histórico | TC-026 |
| [ ] | 4.2 | Pruebas de autorización: ningún rol distinto de `ADMIN` puede escribir | TC-016 (parte admin), `AutorizacionMatrizTest` |
| [ ] | 4.3 | Prueba: desactivar un usuario corta el acceso en la siguiente petición | TC-027 |
| [ ] | 4.4 | Colección Bruno `05-admin` | Reporte en el PR |
| [ ] | 4.5 | Registrar en el [Registro de IA](../../docs/04-gestion/ia-register.md) todo uso de IA en este módulo | Entradas con validación |
