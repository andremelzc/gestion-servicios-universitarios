# Backlog 03 — Gestión de solicitudes

> Convenciones: [README](README.md). Fuente: [`specs/03-gestion-solicitudes/03-tasks.md`](../../specs/03-gestion-solicitudes/03-tasks.md). Matriz oficial de transiciones: [Arquitectura §2.2](../02-diseno/arquitectura-tecnica.md#22-matriz-de-transiciones-y-permisos). Contratos: [API §3.2](../02-diseno/api-rest.md#32-solicitudes--solicitudes), [§3.3](../02-diseno/api-rest.md#33-comentarios-y-evidencias), [§3.6](../02-diseno/api-rest.md#36-usuarios-y-roles--adminusuarios-usuariostecnicos-roles). TASK-009/010/011 (Fase 1) · TASK-034 y TASK-035 (Fase 2).

## Backend (R2; comentarios R3)

### GES-01 · [Gestión] Backend - `Transicion` (enum con origen, destino y roles)
**Rol:** R2 · **Labels:** `backend` `US-08` `US-09` `US-10` `US-11` `TASK-009` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** REG-09 · **Bloquea:** GES-03
- [ ] Modelar cada transición (estado origen/destino, roles, condiciones) según la matriz oficial

**Aceptación:** revisión contra la matriz.

### GES-02 · [Gestión] Backend - `AccessPolicy` (ver / ejecutar / `accionesPermitidas`)
**Rol:** R2 · **Labels:** `backend` `seguridad` `RN-16` `TASK-009` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** GES-01 · **Bloquea:** REG-12, GES-03
- [ ] Reglas por rol y alcance (propio, asignado, misma área, admin)
- [ ] Calcular `accionesPermitidas` para el detalle

**Aceptación:** `AccessPolicyTest`.

### GES-03 · [Gestión] Backend - `SolicitudWorkflowService.ejecutar`
**Rol:** R2 · **Labels:** `backend` `US-08` `TASK-009` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** GES-01, GES-02, GES-04
- [ ] 404/403/409/400 y validación del estado dentro de la transacción
- [ ] Atajo de [ADR-003](../02-diseno/decisiones-arquitectura.md)

**Aceptación:** CA-2, CA-12.

### GES-04 · [Gestión] Backend - `HistorialService` (solo inserción)
**Rol:** R3 · **Labels:** `backend` `db` `US-11` `TASK-009` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** REG-01
- [ ] Inserción de historial en la misma transacción; sin `UPDATE`/`DELETE`
- [ ] Los triggers de BD ya impiden `UPDATE`/`DELETE`; prueba SQL simple

**Aceptación:** CA-13 (prueba SQL).

### GES-05 · [Gestión] Backend - Pruebas de transiciones inválidas
**Rol:** R2 · **Labels:** `backend` `qa` `RN-06` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** GES-03
- [ ] Probar las transiciones inválidas más comunes contra la matriz

**Aceptación:** `TransicionesInvalidasTest`.

### GES-06 · [Gestión] Backend - `PUT /solicitudes/{id}/asignar`
**Rol:** R2 · **Labels:** `backend` `API` `US-08` `TASK-010` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** GES-03
- [ ] Asignar y reasignar; valida que el técnico esté activo y sea del área

**Aceptación:** CA-1, CA-4, CA-8.

### GES-07 · [Gestión] Backend - `PUT /solicitudes/{id}/iniciar-atencion`
**Rol:** R2 · **Labels:** `backend` `API` `US-09` `TASK-010` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** GES-03

**Aceptación:** CA-9 (solo el técnico asignado o admin).

### GES-08 · [Gestión] Backend - `PUT /solicitudes/{id}/resolver` (multipart)
**Rol:** R2 · **Labels:** `backend` `API` `US-10` `TASK-010` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** GES-03, REG-07
- [ ] Informe obligatorio + 1–3 evidencias, reutilizando `FileStorageService`

**Aceptación:** CA-10, CA-11.

### GES-09 · [Gestión] Backend - `GET /solicitudes` (bandeja) y `GET …/historial`
**Rol:** R2 · **Labels:** `backend` `API` `RF-12` `TASK-010` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** REG-03, GES-02
- [ ] `Specification` con alcance por rol, filtro `vencida`, paginación y orden con lista blanca

**Aceptación:** CA-16.

### GES-10 · [Gestión] Backend - `GET /usuarios/tecnicos` (también cubre Admin 2.5)
**Rol:** R2 · **Labels:** `backend` `API` `US-08` `TASK-010` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** AUTH-01
- [ ] Área forzada para supervisor; incluir carga actual de cada técnico

**Aceptación:** CA-17.

### GES-11 · [Gestión] Backend - `PUT /solicitudes/{id}/evaluar`
**Rol:** R2 · **Labels:** `backend` `API` `US-23` `TASK-034` · **Sprint:** S2 · **Milestone:** 2.2 Gestión completa, Dashboard y API documentada · **Límite:** 28/10 · **Bloqueado por:** GES-03, REG-04
- [ ] `REGISTRADA → EN_EVALUACION`; cambio de prioridad y recálculo de SLA

**Aceptación:** CA-6.

### GES-13 · [Gestión] Backend - `PUT …/cerrar`
**Rol:** R2 · **Labels:** `backend` `API` `US-25` `TASK-034` · **Sprint:** S2 · **Milestone:** 2.2 Gestión completa, Dashboard y API documentada · **Límite:** 28/10 · **Bloqueado por:** GES-03
- [ ] Cerrar una solicitud `RESUELTA` (`RESUELTA → CERRADA`, guarda `fecha_cierre`)

**Aceptación:** CA-14.

### GES-14 · [Gestión] Backend - `@PreAuthorize` y `@Operation` en cada endpoint
**Rol:** R2 · **Labels:** `backend` `seguridad` `TS-09` · **Sprint:** S2 · **Milestone:** 2.2 Gestión completa, Dashboard y API documentada · **Límite:** 28/10 · **Bloqueado por:** GES-06…GES-11, GES-13, OPS-27
- [ ] `@PreAuthorize` coherente con la [matriz de autorización](../02-diseno/api-rest.md#4-matriz-de-autorización-por-endpoint)
- [ ] `@Operation`, `@ApiResponse` y ejemplos en los endpoints del módulo

**Aceptación:** CA-3, CA-5.

### GES-15 · [Gestión] Backend - Comentarios (`GET/POST …/comentarios`)
**Rol:** R3 · **Labels:** `backend` `API` `US-27` `TASK-035` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** GES-03, ADM-10 · **Prioridad:** S
- [ ] `ComentarioService` con visibilidad por rol (privados solo para roles internos)
- [ ] `@SinHtml` y límites de longitud

**Aceptación:** CA-18, CA-19.

## Frontend (R5; apoyo R4)

> Mock: contratos de API §3.2/§3.3/§3.6 con **MSW**; el Frontend no espera al backend. Los issues usan componentes comunes de `BASE-04`.

### GES-16 · [Gestión] Frontend - `BandejaSupervisorPage`
**Rol:** R5 · **Labels:** `frontend` `US-08` `TASK-011` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** AUTH-18, REG-20
- [ ] Filtros, pestañas por estado y paginación
- [ ] Indicador de SLA accesible (no solo color)

**Aceptación:** UAT-04.

### GES-17 · [Gestión] Frontend - `BandejaTecnicoPage` (móvil primero)
**Rol:** R5 · **Labels:** `frontend` `US-09` `TASK-011` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** AUTH-18, REG-20

**Aceptación:** UAT-05.

### GES-18 · [Gestión] Frontend - `ModalAsignacion`
**Rol:** R5 · **Labels:** `frontend` `US-08` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** BASE-04
- [ ] Asignación con la lista de técnicos y su carga
- [ ] Focus-trap y cierre con `Esc`

**Aceptación:** CA-1.

### GES-19 · [Gestión] Frontend - `ModalResolucion` con `FileUploader`
**Rol:** R5 · **Labels:** `frontend` `US-10` `TASK-011` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** REG-16
- [ ] Informe y evidencia obligatoria (1–3 archivos)

**Aceptación:** CA-10, CA-11.

### GES-21 · [Gestión] Frontend - `LineaTiempoHistorial` y `AccionesSolicitud`
**Rol:** R5 · **Labels:** `frontend` `US-11` `TASK-011` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** REG-19
- [ ] Reutilizar el `Timeline` de `REG-19`
- [ ] Botones según `accionesPermitidas` del backend, incluido "Cerrar" con confirmación simple (UAT-06)

**Aceptación:** CA-13.

### GES-22 · [Gestión] Frontend - `ComentariosPanel`
**Rol:** R4 · **Labels:** `frontend` `US-27` `TASK-035` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** BASE-04 · **Prioridad:** S
- [ ] Lista y formulario; opción "privado" solo para roles internos

**Aceptación:** CA-18.

## Calidad (R6)

### GES-24 · [Gestión] QA - Suite de autorización completa del módulo
**Rol:** R6 · **Labels:** `qa` `seguridad` · **Sprint:** S2 · **Milestone:** 2.2 Gestión completa, Dashboard y API documentada · **Límite:** 28/10 · **Bloqueado por:** GES-14
- [ ] Rol × endpoint × propio/ajeno/otra área

**Aceptación:** TC-016, 019, 023.
