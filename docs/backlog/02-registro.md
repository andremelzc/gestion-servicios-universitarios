# Backlog 02 — Registro y seguimiento de solicitudes

> Convenciones: [README](README.md). Fuente: [`specs/02-registro-solicitudes/03-tasks.md`](../../specs/02-registro-solicitudes/03-tasks.md). Contratos: [API §3.2](../02-diseno/api-rest.md#32-solicitudes--solicitudes) y [§3.5](../02-diseno/api-rest.md#35-catálogos--areas-categorias-prioridades-estados). TASK-006/007/008 (Fase 1) y TASK-034 (cancelar, Fase 2).

## Backend (R2)

### REG-01 · [Registro] Backend - Entidades de solicitud y catálogos
**Rol:** R2 · **Labels:** `backend` `db` `US-05` `TASK-006` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** AUTH-02, BASE-03 · **Bloquea:** REG-02…REG-12, REG-14
- [ ] Entidades `Solicitud`, `Categoria`, `Prioridad`, `EstadoSolicitud`, `Evidencia`, `HistorialSolicitud` (LAZY)
- [ ] Mapeo con `ddl-auto=validate`

**Aceptación:** arranque contra Flyway sin errores.

### REG-02 · [Registro] Backend - DTO con Bean Validation y `@SinHtml`
**Rol:** R2 · **Labels:** `backend` `US-05` `TASK-006` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** REG-01, AUTH-06
- [ ] `record` de request/response con las longitudes de [API §3.2](../02-diseno/api-rest.md#32-solicitudes--solicitudes)
- [ ] `@SinHtml` en descripción, ubicación y demás texto libre

**Aceptación:** CA-3 y CA-6 con pruebas de validación.

### REG-03 · [Registro] Backend - Repositorios, `SolicitudSpecification` y proyecciones
**Rol:** R2 · **Labels:** `backend` `db` `US-21` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** REG-01
- [ ] Repositorios y `SolicitudSpecification` (estado, prioridad, fechas, texto)
- [ ] Proyecciones DTO sin N+1

**Aceptación:** sin N+1 en el log de SQL.

### REG-04 · [Registro] Backend - `SlaCalculator` (función pura con `Clock`)
**Rol:** R2 · **Labels:** `backend` `US-05` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** REG-01
- [ ] Calcular `fechaLimite` según SLA de la prioridad, inyectando `Clock`

**Aceptación:** `SlaCalculatorTest` (CA-10).

### REG-05 · [Registro] Backend - `CodigoSolicitudService` (código único)
**Rol:** R3 · **Labels:** `backend` `US-07` `TASK-007` `ADR-011` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** REG-01
- [ ] Incremento atómico de la secuencia anual (`UPDATE … LAST_INSERT_ID`) e inserción de la fila del año cuando no existe

**Aceptación:** `CodigoSolicitudServiceTest` sin duplicados (CA-9).

### REG-06 · [Registro] Backend - `FileTypeValidator`
**Rol:** R3 · **Labels:** `backend` `seguridad` `US-06` `TASK-007` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** REG-01
- [ ] Validar firma (*magic bytes*), extensión, tipo declarado y tamaño (5 MB)

**Aceptación:** `FileTypeValidatorTest` con `.exe` renombrado (CA-5).

### REG-07 · [Registro] Backend - `FileStorageService` seguro
**Rol:** R3 · **Labels:** `backend` `seguridad` `US-06` `TASK-007` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** REG-06
- [ ] Nombre UUID, ruta fuera del *webroot*, sin *path traversal*
- [ ] Compensación (borrar archivos) si falla la transacción

**Aceptación:** `FileStorageServiceTest`; CA-15.

### REG-08 · [Registro] Backend - `SolicitudService.crear` transaccional
**Rol:** R3 · **Labels:** `backend` `US-05` `US-07` `TASK-007` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** REG-02, REG-04, REG-05, REG-07
- [ ] Algoritmo del [plan §1.2](../../specs/02-registro-solicitudes/02-plan.md)
- [ ] Registrar la primera fila de historial en la misma transacción

**Aceptación:** CA-1, CA-2, CA-15.

### REG-09 · [Registro] Backend - `POST /solicitudes` multipart
**Rol:** R2 · **Labels:** `backend` `API` `US-05` `TASK-007` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** REG-08, AUTH-08
- [ ] Partes `solicitud` (JSON) y `archivos`; `201` con cabecera `Location`
- [ ] Publicar primero el endpoint con respuesta fija si el FE lo necesita (contrato)

**Aceptación:** `SolicitudControllerTest`.

### REG-10 · [Registro] Backend - Límites multipart (y referencia a Nginx)
**Rol:** R2 · **Labels:** `backend` `seguridad` `US-06` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** REG-09
- [ ] `spring.servlet.multipart` (5 MB por archivo, 3 archivos, tamaño total)
- [ ] Alinear `client_max_body_size` de Nginx con `OPS-05`

**Aceptación:** CA-4 (413 al exceder).

### REG-11 · [Registro] Backend - `GET /solicitudes/mis-solicitudes`
**Rol:** R2 · **Labels:** `backend` `API` `US-21` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** REG-03, REG-09
- [ ] Filtros, paginación y orden con lista blanca de campos

**Aceptación:** CA-11.

### REG-12 · [Registro] Backend - Detalle, historial y descarga de evidencia con `AccessPolicy`
**Rol:** R2 · **Labels:** `backend` `seguridad` `US-21` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** REG-11, GES-02
- [ ] `GET /solicitudes/{id}`, `GET …/historial`, descarga de evidencia
- [ ] 404 si la solicitud es ajena (no revelar existencia)

**Aceptación:** CA-12 y CA-13 (IDOR).

### REG-14 · [Registro] Backend - `GET /categorias` y `GET /prioridades` (activas)
**Rol:** R2 · **Labels:** `backend` `API` `US-05` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** REG-01
- [ ] Lectura abierta a autenticados; solo registros activos (coordina con `ADM-06`)

**Aceptación:** CA-8.

## Frontend (R4)

> Todos los Issues de esta sección trabajan con **MSW** según [API §3.2](../02-diseno/api-rest.md#32-solicitudes--solicitudes) y no esperan al backend.

### REG-15 · [Registro] Frontend - `NuevaSolicitudPage`
**Rol:** R4 · **Labels:** `frontend` `US-05` `TASK-008` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** AUTH-03, AUTH-04, REG-20
- [ ] Formulario con Zod, contador de caracteres y `FormData` multipart
- [ ] Borrador en `sessionStorage`
- [ ] Combos de categoría/prioridad desde `GET /categorias` y `/prioridades` (mock)
- [ ] Sustituir mocks cuando `REG-09` esté en `develop`

**Aceptación:** UAT-02.

### REG-16 · [Registro] Frontend - Componente `FileUploader`
**Rol:** R4 · **Labels:** `frontend` `US-06` `TASK-008` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** BASE-04
- [ ] *Drag & drop*, vista previa y límites 5 MB / 3 archivos
- [ ] Accesible por teclado; mensajes de error por archivo

**Aceptación:** `FileUploader.test` (CA-4).

### REG-17 · [Registro] Frontend - Pantalla de confirmación con el código
**Rol:** R4 · **Labels:** `frontend` `US-07` `TASK-008` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** REG-15
- [ ] Mostrar el código generado y enlaces a "Ver mi solicitud" y "Nueva solicitud"

**Aceptación:** CA-1.

### REG-18 · [Registro] Frontend - `MisSolicitudesPage`
**Rol:** R4 · **Labels:** `frontend` `US-21` `TASK-008` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** AUTH-03, REG-20
- [ ] Tabla/tarjetas, filtros con *debounce*, paginación y estado vacío

**Aceptación:** CA-11; UAT-03.

### REG-19 · [Registro] Frontend - `SolicitudDetallePage` con `Timeline` y acciones
**Rol:** R4 · **Labels:** `frontend` `US-21` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** REG-20
- [ ] Detalle, `Timeline`, evidencias descargables
- [ ] Botón "Cancelar" según `accionesPermitidas` (la acción llega con `REG-13`)

**Aceptación:** CA-13, CA-14. (`GES-21` reutiliza este `Timeline`.)

### REG-20 · [Registro] Frontend - `EstadoBadge` y `PrioridadTag` accesibles
**Rol:** R5 · **Labels:** `frontend` `accesibilidad` `US-21` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** UX-04
- [ ] Texto + icono + color (no solo color)

**Aceptación:** revisión manual de accesibilidad (texto + icono + color, contraste).

## Calidad (R6)

### REG-21 · [Registro] QA - Integración del alta (éxito y rollback)
**Rol:** R2 · **Labels:** `qa` · **Sprint:** S1 · **Milestone:** 1.5 Pruebas, E2E, informe y presentación de la Fase 1 · **Límite:** 16/10 · **Bloqueado por:** REG-09
- [ ] Testcontainers: alta correcta y rollback total

**Aceptación:** TC-007, 008, 013.

### REG-22 · [Registro] QA - Pruebas de seguridad del alta
**Rol:** R6 · **Labels:** `qa` `seguridad` · **Sprint:** S1 · **Milestone:** 1.5 Pruebas, E2E, informe y presentación de la Fase 1 · **Límite:** 16/10 · **Bloqueado por:** REG-09, REG-12
- [ ] HTML en descripción, `.exe` renombrado, archivo > 5 MB, IDOR

**Aceptación:** TC-009, 010, 011, 023.
