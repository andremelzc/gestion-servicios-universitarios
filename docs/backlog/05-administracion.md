# Backlog 05 — Administración

> Convenciones: [README](README.md). Fuente: [`specs/05-administracion/03-tasks.md`](../../specs/05-administracion/03-tasks.md). Contratos: [API §3.5](../02-diseno/api-rest.md#35-catálogos--areas-categorias-prioridades-estados) y [§3.6](../02-diseno/api-rest.md#36-usuarios-y-roles--adminusuarios-usuariostecnicos-roles). TASK-018 (Fase 2, milestone 2.3). Los catálogos básicos ya se siembran en `V2`.

## Backend — Catálogos (R3)

### ADM-01 · [Admin] Backend - Entidad `Area` y consultas de activos
**Rol:** R3 · **Labels:** `backend` `db` `TASK-018` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** REG-01, DASH-09
- [ ] `Area` y `findAllByActivoTrue` en `Area`, `Categoria`, `Prioridad`, `EstadoSolicitud` (las entidades base nacen en `REG-01`)

**Aceptación:** arranque contra Flyway.

### ADM-02 · [Admin] Backend - `CategoriaService`
**Rol:** R3 · **Labels:** `backend` `US-15` `US-16` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** ADM-01
- [ ] Alta, edición, baja lógica, reactivar; unicidad; área activa; SLA ≥ 1

**Aceptación:** CA-1…CA-4.

### ADM-03 · [Admin] Backend - `AreaService`
**Rol:** R3 · **Labels:** `backend` `US-33` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** ADM-01
- [ ] Regla "no desactivar un área con usuarios activos"

**Aceptación:** CA-5.

### ADM-04 · [Admin] Backend - `PrioridadService`
**Rol:** R3 · **Labels:** `backend` `US-31` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** ADM-01
- [ ] Cambio de SLA no retroactivo (no recalcula solicitudes existentes)

**Aceptación:** CA-6.

### ADM-05 · [Admin] Backend - `EstadoService` (solo presentación)
**Rol:** R3 · **Labels:** `backend` `US-32` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** ADM-01
- [ ] Editar nombre visible, color y orden; validar el color

**Aceptación:** CA-7.

### ADM-06 · [Admin] Backend - Controladores de catálogos
**Rol:** R3 · **Labels:** `backend` `API` `seguridad` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** ADM-02…ADM-05
- [ ] `Area`, `Categoria`, `Prioridad`, `Estado`: lectura abierta a autenticados, escritura solo `ADMIN`; OpenAPI

**Aceptación:** CA-13.

## Backend — Usuarios y roles (R3)

### ADM-07 · [Admin] Backend - `AdminUsuarioService`
**Rol:** R3 · **Labels:** `backend` `US-17` `US-34` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** AUTH-01, ADM-03
- [ ] Alta, edición, cambio de rol/área (RN-21), baja lógica y reactivar

**Aceptación:** CA-8, CA-9, CA-10.

### ADM-08 · [Admin] Backend - Protecciones: último admin y auto-desactivación
**Rol:** R3 · **Labels:** `backend` `seguridad` `US-34` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** ADM-07

**Aceptación:** CA-11.

### ADM-10 · [Admin] Backend - `AdminUsuariosController` y `RolController`
**Rol:** R3 · **Labels:** `backend` `API` `US-34` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** ADM-07
- [ ] Listado paginado con filtros `rol`, `idArea`, `activo`, `q`

**Aceptación:** `AdminUsuariosControllerTest`.

### ADM-11 · [Admin] Backend - Logs de auditoría de administración
**Rol:** R3 · **Labels:** `backend` `seguridad` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** ADM-07
- [ ] Registrar quién cambió el rol/estado de quién (sin datos sensibles)

**Aceptación:** revisión de logs. (`GET /usuarios/tecnicos` está en `GES-10`.)

## Frontend (R5; apoyo R4)

> Mock: JSON de API §3.5/§3.6 con MSW; no depende del backend.

### ADM-12 · [Admin] Frontend - Hook `useCrud` genérico
**Rol:** R5 · **Labels:** `frontend` `TASK-018` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.3 · **Bloqueado por:** AUTH-15
- [ ] Paginación, búsqueda con *debounce* y errores por campo

**Aceptación:** `useCrud.test`.

### ADM-13 · [Admin] Frontend - `AdminLayout` y rutas `/admin/*`
**Rol:** R5 · **Labels:** `frontend` `RBAC` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** AUTH-18
- [ ] `RoleRoute(['ADMIN'])` y menú lateral

**Aceptación:** CA-13.

### ADM-14 · [Admin] Frontend - `DataTable` reutilizable
**Rol:** R5 · **Labels:** `frontend` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.3 · **Bloqueado por:** BASE-04
- [ ] Tabla/tarjetas responsive, filtro "Mostrar inactivas" y paginación

**Aceptación:** CA-14.

### ADM-15 · [Admin] Frontend - Pantallas de Categorías y Áreas
**Rol:** R5 · **Labels:** `frontend` `US-15` `US-16` `US-33` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** ADM-12, ADM-14, ADM-19
- [ ] Listado y modales de alta/edición, baja lógica y reactivar

**Aceptación:** UAT-09.

### ADM-16 · [Admin] Frontend - Pantalla de Prioridades (SLA)
**Rol:** R5 · **Labels:** `frontend` `US-31` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** ADM-12, ADM-14
- [ ] Edición de SLA con aviso "no retroactivo"

**Aceptación:** CA-6.

### ADM-17 · [Admin] Frontend - Pantalla de Estados (solo presentación)
**Rol:** R5 · **Labels:** `frontend` `US-32` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** ADM-12, ADM-14
- [ ] Edición de nombre/color con aviso de contraste

**Aceptación:** CA-7.

### ADM-18 · [Admin] Frontend - Pantalla de Usuarios
**Rol:** R5 · **Labels:** `frontend` `US-17` `US-34` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** ADM-12, ADM-14, ADM-19
- [ ] Filtros, alta, edición, desactivar/reactivar; campo de área condicional al rol

**Aceptación:** CA-8…CA-11.

### ADM-19 · [Admin] Frontend - `ConfirmDialog` accesible
**Rol:** R4 · **Labels:** `frontend` `accesibilidad` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** BASE-04
- [ ] Sin `window.confirm`; foco atrapado y `Esc`

**Aceptación:** CA-14.

### ADM-20 · [Admin] Frontend - Refrescar la caché de catálogos
**Rol:** R5 · **Labels:** `frontend` `RF-09` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** ADM-15, REG-15
- [ ] Invalidar catálogos tras un cambio, para formulario de solicitud y dashboard

**Aceptación:** CA-1 (el cambio se ve de inmediato).

## Calidad (R6)

### ADM-21 · [Admin] QA - Baja lógica de categoría
**Rol:** R5 · **Labels:** `qa` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** ADM-06

**Aceptación:** TC-026 (desaparece del formulario, sigue en el histórico).

### ADM-22 · [Admin] QA - Autorización: solo `ADMIN` escribe
**Rol:** R6 · **Labels:** `qa` `seguridad` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** ADM-10

**Aceptación:** TC-016 (parte admin) y `AutorizacionMatrizTest`.

### ADM-23 · [Admin] QA - Desactivar usuario corta el acceso
**Rol:** R3 · **Labels:** `qa` `seguridad` · **Sprint:** S2 · **Milestone:** 2.3 Administración, comentarios y cambio de contraseña · **Límite:** 31/10 · **Bloqueado por:** ADM-07, AUTH-07

**Aceptación:** TC-027 (la siguiente petición con su token recibe 401).
