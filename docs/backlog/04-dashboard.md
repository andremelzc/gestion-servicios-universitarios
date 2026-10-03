# Backlog 04 — Dashboard

> Convenciones: [README](README.md). Fuente: [`specs/04-dashboard/03-tasks.md`](../../specs/04-dashboard/03-tasks.md). Contrato: [API §3.4](../02-diseno/api-rest.md#34-dashboard--dashboard). TASK-016 (BE) y TASK-017 (FE), Fase 2 (milestone 2.2). Indicadores del PDF: registradas, pendientes, atendidas, por categoría, por prioridad, tiempo promedio de atención, % resueltas, vencidas, por responsable.

## Backend (R3)

### DASH-01 · [Dashboard] Backend - Dataset de prueba conocido
**Rol:** R3 · **Labels:** `backend` `db` `qa` `TASK-016` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** REG-01
- [ ] 150 solicitudes en 6 estados, 2 áreas y fechas variadas, versionado en `src/test/resources`

**Aceptación:** dataset usado por `DashboardRepositoryIT`.

### DASH-02 · [Dashboard] Backend - `DashboardRepository.kpis` (una sola consulta)
**Rol:** R3 · **Labels:** `backend` `db` `US-12` `US-14` `US-30` `TASK-016` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.2 · **Bloqueado por:** DASH-01
- [ ] Agregación condicional: registradas, pendientes, atendidas, vencidas, MTTR

**Aceptación:** CA-1, CA-7.

### DASH-03 · [Dashboard] Backend - Series por categoría, prioridad, estado y responsable
**Rol:** R3 · **Labels:** `backend` `db` `US-13` `US-28` `US-30` `TASK-016` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.2 · **Bloqueado por:** DASH-01
- [ ] `porCategoria`, `porPrioridad` (RIGHT JOIN para mostrar ceros), `porEstado` (con color), `porResponsable`

**Aceptación:** CA-5, CA-6, CA-9.

### DASH-04 · [Dashboard] Backend - Consulta de vencidas paginada
**Rol:** R3 · **Labels:** `backend` `db` `US-29` `TASK-016` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.2 · **Bloqueado por:** DASH-01
- [ ] Ordenada por mayor retraso

**Aceptación:** CA-8.

### DASH-06 · [Dashboard] Backend - `ScopeResolver`
**Rol:** R3 · **Labels:** `backend` `seguridad` `RN-16` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.2 · **Bloqueado por:** AUTH-07
- [ ] Admin: todo · Supervisor: su área · Técnico: sus solicitudes

**Aceptación:** CA-2, CA-3.

### DASH-07 · [Dashboard] Backend - `DashboardService`
**Rol:** R3 · **Labels:** `backend` `US-12` `US-14` `US-30` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.2 · **Bloqueado por:** DASH-02, DASH-06
- [ ] Cálculo de porcentajes, MTTR `null` sin datos, conversión del rango de fechas

**Aceptación:** CA-10, CA-11.

### DASH-08 · [Dashboard] Backend - DTO `KpisResponse`, `SerieItem`, `SerieEstadoItem`
**Rol:** R3 · **Labels:** `backend` `contrato` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** BASE-03
- [ ] `record` conforme a [API §3.4](../02-diseno/api-rest.md#34-dashboard--dashboard)

**Aceptación:** revisión de contrato.

### DASH-09 · [Dashboard] Backend - `DashboardController` (6 endpoints)
**Rol:** R3 · **Labels:** `backend` `API` `TASK-016` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.2 · **Bloqueado por:** DASH-07, DASH-08
- [ ] Validar `desde ≤ hasta`; `@PreAuthorize` (no `ESTUDIANTE`); OpenAPI

**Aceptación:** CA-4, CA-10.

## Frontend (R5)

> Mock: JSON de API §3.4 con MSW. No depende del backend.

### DASH-10 · [Dashboard] Frontend - `DashboardPage` con filtros y estados por widget
**Rol:** R5 · **Labels:** `frontend` `US-12` `TASK-017` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.2 · **Bloqueado por:** AUTH-18, DASH-08 (contrato)
- [ ] Filtros de fecha; `Promise.all` y `AbortController`
- [ ] Cada widget con su propio estado cargando/vacío/error
- [ ] Sustituir el mock cuando `DASH-09` esté en `develop`

**Aceptación:** UAT-10.

### DASH-11 · [Dashboard] Frontend - `KpiCard` y rejilla responsive
**Rol:** R5 · **Labels:** `frontend` `US-12` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.2 · **Bloqueado por:** BASE-04
- [ ] Rejilla de 1 / 2 / 5 columnas

**Aceptación:** CA-13.

### DASH-12 · [Dashboard] Frontend - Gráficos (Recharts)
**Rol:** R5 · **Labels:** `frontend` `US-13` `US-28` `US-30` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.2 · **Bloqueado por:** BASE-04
- [ ] `CategoriaPieChart`, `PrioridadBarChart`, `EstadoBarChart`, `ResponsableBarChart`
- [ ] Leyenda y vista alternativa "Ver datos" (accesibilidad)

**Aceptación:** CA-5, CA-6, CA-9.

### DASH-13 · [Dashboard] Frontend - `VencidasTable`
**Rol:** R4 · **Labels:** `frontend` `US-29` · **Sprint:** S2 · **Milestone:** 2.2 Gestión completa, Dashboard y API documentada · **Límite:** 28/10 · **Bloqueado por:** BASE-04
- [ ] Tabla con enlace al detalle de la solicitud

**Aceptación:** CA-8.

### DASH-14 · [Dashboard] Frontend - Estados vacío/error/carga y MTTR "—"
**Rol:** R5 · **Labels:** `frontend` · **Sprint:** S2 · **Milestone:** 2.2 Gestión completa, Dashboard y API documentada · **Límite:** 28/10 · **Bloqueado por:** DASH-10
- [ ] Mostrar "—" cuando el MTTR es `null`

**Aceptación:** CA-11.

### DASH-15 · [Dashboard] Frontend - Visibilidad por rol
**Rol:** R5 · **Labels:** `frontend` `RN-16` · **Sprint:** S2 · **Milestone:** 2.2 Gestión completa, Dashboard y API documentada · **Límite:** 28/10 · **Bloqueado por:** AUTH-18
- [ ] Ocultar "Dashboard" para `ESTUDIANTE`; filtro "Área" solo para admin

**Aceptación:** CA-4.


## Calidad (R6)

### DASH-17 · [Dashboard] QA - Prueba de alcance con dos áreas
**Rol:** R3 · **Labels:** `qa` `seguridad` · **Sprint:** S2 · **Milestone:** 2.2 Gestión completa, Dashboard y API documentada · **Límite:** 28/10 · **Bloqueado por:** DASH-09

**Aceptación:** TC-024 (supervisor TI no ve datos de Mantenimiento).

### DASH-19 · [Dashboard] QA - Pruebas de componente de gráficos
**Rol:** R5 · **Labels:** `qa` `frontend` · **Sprint:** S2 · **Milestone:** 2.2 Gestión completa, Dashboard y API documentada · **Límite:** 28/10 · **Bloqueado por:** DASH-12
- [ ] Con datos y con datos vacíos

**Aceptación:** `Charts.test`.
