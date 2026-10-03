# Backlog 08 — Observabilidad y Pruebas

> Convenciones: [README](README.md). Fuente: [`specs/07-observabilidad-testing/03-tasks.md`](../../specs/07-observabilidad-testing/03-tasks.md) · [Observabilidad](../03-calidad-y-operacion/observabilidad.md) · [Estrategia de pruebas](../03-calidad-y-operacion/estrategia-pruebas.md). TASK-012, 013, 020, 021, 030, 031, 036, 037. Fase IV del enunciado: pruebas funcionales/aceptación/usuario/seguridad, carga y estrés, observabilidad (logs, métricas, trazas, monitoreo, alertas, incidentes).

# Épica OBS — Observabilidad

## Backend (R6)

### OBS-01 · [Observabilidad] Backend - Actuator, Micrometer Prometheus y Tracing/OTel
**Rol:** R6 · **Labels:** `backend` `observabilidad` `TS-05` `TASK-020` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.5 · **Bloqueado por:** BASE-03
- [ ] Dependencias de Actuator, `micrometer-registry-prometheus` y Micrometer Tracing/OpenTelemetry

**Aceptación:** `/actuator/health` y `/actuator/prometheus` responden.

### OBS-02 · [Observabilidad] Backend - `TraceIdFilter` (MDC, `X-Trace-Id`, `traceparent`)
**Rol:** R6 · **Labels:** `backend` `observabilidad` `TS-05` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.5 · **Bloqueado por:** OBS-01

**Aceptación:** CA-2 (cada respuesta lleva `X-Trace-Id` y el log lo incluye).

### OBS-03 · [Observabilidad] Backend - Logs JSON (test/prod) y texto en dev
**Rol:** R6 · **Labels:** `backend` `observabilidad` `TS-05` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.5 · **Bloqueado por:** OBS-02

**Aceptación:** CA-3.

### OBS-04 · [Observabilidad] Backend - 500 genérico con `traceId` (sin *stacktrace* al cliente)
**Rol:** R3 · **Labels:** `backend` `observabilidad` `seguridad` `TS-05` · **Sprint:** S3 · **Milestone:** 2.5 Observabilidad, alertas e incidentes · **Límite:** 06/11 · **Bloqueado por:** AUTH-09, OBS-02
- [ ] Extender `GlobalExceptionHandler`: 500 genérico + `traceId`; *stacktrace* solo en el log

**Aceptación:** CA-1 (TC-028).

### OBS-06 · [Observabilidad] Backend - Métricas de negocio
**Rol:** R3 · **Labels:** `backend` `observabilidad` `TS-05` · **Sprint:** S3 · **Milestone:** 2.5 Observabilidad, alertas e incidentes · **Límite:** 06/11 · **Bloqueado por:** OBS-01, GES-03
- [ ] Contadores `solicitudes_transiciones_total` y `solicitudes_creadas_total`, con etiquetas de baja cardinalidad

**Aceptación:** CA-4.

### OBS-07 · [Observabilidad] DevOps - Actuator restringido; `prometheus` no público
**Rol:** R6 · **Labels:** `devops` `seguridad` `observabilidad` `TS-05` · **Sprint:** S3 · **Milestone:** 2.5 Observabilidad, alertas e incidentes · **Límite:** 06/11 · **Bloqueado por:** OBS-01, OPS-05

**Aceptación:** CA-4 (verificado desde fuera de la red interna).

## Monitoreo y alertas (R6; apoyo R3)

### OBS-09 · [Observabilidad] DevOps - `docker-compose.monitoring.yml` (Prometheus + Grafana + Jaeger)
**Rol:** R6 · **Labels:** `devops` `observabilidad` `TS-05` · **Sprint:** S3 · **Milestone:** 2.5 Observabilidad, alertas e incidentes · **Límite:** 06/11 · **Bloqueado por:** OBS-01, OPS-03

- [ ] Jaeger *all-in-one* (visor de trazas OTLP) junto a Prometheus y Grafana

**Aceptación:** CA-7.

### OBS-10 · [Observabilidad] DevOps - `prometheus.yml` y `alert-rules.yml`
**Rol:** R6 · **Labels:** `devops` `observabilidad` `TS-05` `TASK-030` · **Sprint:** S3 · **Milestone:** 2.5 Observabilidad, alertas e incidentes · **Límite:** 06/11 · **Bloqueado por:** OBS-09, OBS-06
- [ ] 3 alertas: instancia caída, error 5xx y BD inaccesible ([Observabilidad §6](../03-calidad-y-operacion/observabilidad.md#6-alertas))

**Aceptación:** reglas cargadas en Prometheus.

### OBS-11 · [Observabilidad] DevOps - Dashboard de Grafana provisionado
**Rol:** R6 · **Labels:** `devops` `observabilidad` `TS-05` · **Sprint:** S3 · **Milestone:** 2.5 Observabilidad, alertas e incidentes · **Límite:** 06/11 · **Apoya:** R3 · **Bloqueado por:** OBS-09, OBS-06
- [ ] Dashboard "Salud del servicio"

**Aceptación:** CA-7.

### OBS-13 · [Observabilidad] Simulacro de incidente y *post-mortem*
**Rol:** R6 · **Labels:** `observabilidad` `TS-05` `TASK-030` · **Sprint:** S3 · **Milestone:** 2.5 Observabilidad, alertas e incidentes · **Límite:** 06/11 · **Apoya:** R3 · **Bloqueado por:** OBS-10
- [ ] Detener backend y BD; registrar detección, diagnóstico y recuperación
- [ ] *Post-mortem* en `docs/incidentes/`

**Aceptación:** CA-5, CA-6.


---

# Épica QA — Pruebas

## Integración del MVP

### QA-00 · [QA] E2E - Validación del flujo MVP en ambiente integrado (TASK-013)
**Rol:** R6 (con todos) · **Labels:** `qa` `MVP` `TASK-013` · **Sprint:** S1 · **Milestone:** 1.5 Pruebas, E2E, informe y presentación de la Fase 1 · **Límite:** 16/10 · **Bloqueado por:** REG-18, GES-16, GES-17, QA-02, QA-03
- [ ] Guion: Login → registrar solicitud → guardar en MySQL → consultar → asignar → iniciar → resolver
- [ ] Ejecutarlo con los 4 roles y capturar evidencia

**Aceptación:** guion ejecutado con capturas. **Bloquea:** `DOC-02`.

## Backend (R6 con R2/R3)

### QA-01 · [QA] Backend - Base de pruebas (Testcontainers, `Clock` fijo, *builders*)
**Rol:** R6 · **Labels:** `backend` `qa` `TS-06` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** BASE-03
- [ ] Testcontainers MySQL compartido, `Clock` fijo y *builders* de entidades

**Aceptación:** CA-10; las pruebas de integración de otros issues lo reutilizan.

### QA-02 · [QA] Backend - Unitarias de `AuthService`
**Rol:** R3 · **Labels:** `backend` `qa` `TS-06` `TASK-012` · **Sprint:** S1 · **Milestone:** 1.5 Pruebas, E2E, informe y presentación de la Fase 1 · **Límite:** 16/10 · **Bloqueado por:** AUTH-10, AUTH-11, QA-01
- [ ] Login, registro y cambio de contraseña; *con apoyo de IA, revisadas con la lista* (se registra en `QA-24`)

**Aceptación:** TC-001, 002, 004…006.

### QA-03 · [QA] Backend - Unitarias de `SolicitudWorkflowService`
**Rol:** R2 · **Labels:** `backend` `qa` `TS-06` `TASK-012` · **Sprint:** S1 · **Milestone:** 1.5 Pruebas, E2E, informe y presentación de la Fase 1 · **Límite:** 16/10 · **Bloqueado por:** GES-05, QA-01
- [ ] Todas las transiciones válidas e inválidas

**Aceptación:** TC-014…022; cobertura de servicios del MVP ≥ 80 %.

### QA-04 · [QA] Backend - Unitarias de `FileTypeValidator`, `SlaCalculator`, `CodigoSolicitudService`, `AccessPolicy`
**Rol:** R2 · **Labels:** `backend` `qa` `TS-06` · **Sprint:** S1 · **Milestone:** 1.5 Pruebas, E2E, informe y presentación de la Fase 1 · **Límite:** 16/10 · **Bloqueado por:** REG-04…REG-07, GES-02

**Aceptación:** TC-007…011.

### QA-05 · [QA] Backend - Integración de persistencia (migraciones, triggers, constraints)
**Rol:** R3 · **Labels:** `backend` `qa` `db` `TS-06` · **Sprint:** S1 · **Milestone:** 1.5 Pruebas, E2E, informe y presentación de la Fase 1 · **Límite:** 16/10 · **Bloqueado por:** GES-04, QA-01

**Aceptación:** TC-022.

### QA-06 · [QA] Backend - Integración del dashboard con dataset conocido
**Rol:** R3 · **Labels:** `backend` `qa` `TS-06` · **Sprint:** S2 · **Milestone:** 2.2 Gestión completa, Dashboard y API documentada · **Límite:** 28/10 · **Bloqueado por:** DASH-04

**Aceptación:** TC-024, TC-025.


## Frontend (R4 / R5)

### QA-07 · [QA] Frontend - Vitest + Testing Library + MSW y cobertura
**Rol:** R4 · **Labels:** `frontend` `qa` `TS-06` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** BASE-04

**Aceptación:** `npm test` corre en CI.

### QA-08 · [QA] Frontend - Pruebas de formularios, `FileUploader`, `AuthContext` y rutas
**Rol:** R4 · **Labels:** `frontend` `qa` `TS-06` · **Sprint:** S1 · **Milestone:** 1.5 Pruebas, E2E, informe y presentación de la Fase 1 · **Límite:** 16/10 · **Bloqueado por:** QA-07, AUTH-18, REG-16
- [ ] Login, registro, nueva solicitud, `FileUploader`, `AuthContext` y rutas protegidas

**Aceptación:** CA-13.

### QA-10 · [QA] Frontend - Pruebas de `AccionesSolicitud` y gráficos con datos vacíos
**Rol:** R5 · **Labels:** `frontend` `qa` `TS-06` · **Sprint:** S2 · **Milestone:** 2.2 Gestión completa, Dashboard y API documentada · **Límite:** 28/10 · **Bloqueado por:** GES-21, DASH-12

**Aceptación:** CA-13.


## Pruebas de API (R2, apoyo R6)

### QA-11 · [QA] API - Colección Bruno única y entornos `dev`/`ci`/`staging`
**Rol:** R2 · **Labels:** `qa` `API` `TS-06` `TASK-036` · **Sprint:** S3 · **Milestone:** 2.4 Cloud, CD, hardening y Release Candidate · **Límite:** 04/11 · **Bloqueado por:** AUTH-05
- [ ] Una sola colección con carpetas por módulo (auth, solicitudes, gestión, dashboard, admin), variables por entorno y autenticación reutilizable; se completa a medida que cada módulo expone sus endpoints

**Aceptación:** CA-11.

### QA-12 · [QA] API - Ejecutar la colección en CI y tras cada despliegue a *staging*
**Rol:** R2 · **Labels:** `qa` `devops` `API` `TS-06` · **Sprint:** S3 · **Milestone:** 2.4 Cloud, CD, hardening y Release Candidate · **Límite:** 04/11 · **Bloqueado por:** QA-11, OPS-23

**Aceptación:** CA-11 (reporte en CI y en el pipeline de *staging*).

## Carga y estrés (R6)

### QA-14 · [QA] Rendimiento - Sembrar ~2 000 solicitudes (`DemoDataSeeder` modo `carga`)
**Rol:** R3 · **Labels:** `qa` `rendimiento` `TS-07` · **Sprint:** S3 · **Milestone:** 2.6 Carga, estrés, aceptación e informe de pruebas · **Límite:** 10/11 · **Bloqueado por:** BASE-05

**Aceptación:** conteo en BD.

### QA-15 · [QA] Rendimiento - Scripts k6 (`setup` con tokens, escenario único, umbrales)
**Rol:** R6 · **Labels:** `qa` `rendimiento` `TS-07` · **Sprint:** S3 · **Milestone:** 2.6 Carga, estrés, aceptación e informe de pruebas · **Límite:** 10/11 · **Bloqueado por:** QA-14

- [ ] Escenario único con login, creación de solicitudes (con y sin evidencia), consultas y dashboard

**Aceptación:** CA-15.

### QA-16 · [QA] Rendimiento - Ejecutar el perfil nominal (50 VU) y el de estrés (hasta 500 VU)
**Rol:** R6 · **Labels:** `qa` `rendimiento` `TS-07` `TASK-021` · **Sprint:** S3 · **Milestone:** 2.6 Carga, estrés, aceptación e informe de pruebas · **Límite:** 10/11 · **Bloqueado por:** QA-15, OPS-23

**Aceptación:** CA-15, 16.

### QA-17 · [QA] Rendimiento - Identificar el cuello de botella y aplicar al menos 1 mejora
**Rol:** R3 · **Labels:** `qa` `rendimiento` `TS-07` · **Sprint:** S3 · **Milestone:** 2.6 Carga, estrés, aceptación e informe de pruebas · **Límite:** 10/11 · **Bloqueado por:** QA-16
- [ ] Localizar con métricas y trazas, mejorar y repetir la prueba

**Aceptación:** antes/después en el informe.

### QA-18 · [QA] Rendimiento - Sección de rendimiento del informe
**Rol:** R3 · **Labels:** `qa` `docs` `TS-07` · **Sprint:** S3 · **Milestone:** 2.6 Carga, estrés, aceptación e informe de pruebas · **Límite:** 10/11 · **Bloqueado por:** QA-17

**Aceptación:** CA-18.

## Aceptación, usuario e informe

### QA-19 · [QA] UAT - Ejecutar UAT-01…UAT-06 en *staging* con capturas
**Rol:** R4 · **Labels:** `qa` `UAT` `TS-06` `TASK-031` · **Sprint:** S3 · **Milestone:** 2.6 Carga, estrés, aceptación e informe de pruebas · **Límite:** 10/11 · **Bloqueado por:** DOC-03

**Aceptación:** tabla de resultados con capturas.

### QA-20 · [QA] UAT - Ejecutar UAT-09 y UAT-10 en *staging* con capturas
**Rol:** R5 · **Labels:** `qa` `UAT` `TS-06` `TASK-031` · **Sprint:** S3 · **Milestone:** 2.6 Carga, estrés, aceptación e informe de pruebas · **Límite:** 10/11 · **Bloqueado por:** DOC-03

**Aceptación:** tabla de resultados con capturas.

### QA-21 · [QA] UX - Pruebas de usabilidad con ≥ 5 usuarios y cuestionario SUS
**Rol:** R4 · **Labels:** `qa` `UX` `RNF-05` · **Sprint:** S3 · **Milestone:** 2.6 Carga, estrés, aceptación e informe de pruebas · **Límite:** 10/11 · **Apoya:** R5, R6 · **Bloqueado por:** DOC-03

**Aceptación:** SUS ≥ 70.

### QA-22 · [QA] Calidad - Revisión general (hardcode, N+1, manejo de errores) y refactor
**Rol:** R1 · **Labels:** `calidad` `RNF-08` · **Sprint:** S3 · **Milestone:** 2.6 Carga, estrés, aceptación e informe de pruebas · **Límite:** 10/11 · **Bloqueado por:** QA-19
- [ ] Revisión de arquitectura, código, patrones de diseño, secretos y errores
- [ ] Refactor de lo hallado

**Aceptación:** [checklist de release §4](../05-entregables/informes-y-sustentacion.md#4-checklist-de-release-y-revisión-final).

### QA-23 · [QA] Docs - Informe de pruebas
**Rol:** R6 · **Labels:** `qa` `docs` `TS-06` `TASK-037` · **Sprint:** S3 · **Milestone:** 2.6 Carga, estrés, aceptación e informe de pruebas · **Límite:** 10/11 · **Bloqueado por:** QA-18, QA-19…QA-21
- [ ] Redactar las secciones de [Estrategia §13](../03-calidad-y-operacion/estrategia-pruebas.md#13-informe-de-pruebas-entregable) con funcionales, aceptación, usuario, seguridad (SAST/DAST), carga y estrés

**Aceptación:** `INFORME_PRUEBAS` completo. (Es también el entregable 4.3 del módulo 08.)

### QA-24 · [QA] IA - 3 casos de pruebas generadas con IA (prompt → defectos → versión final)
**Rol:** R6 · **Labels:** `qa` `IA` `TS-06` · **Sprint:** S3 · **Milestone:** 2.4 Cloud, CD, hardening y Release Candidate · **Límite:** 04/11 · **Bloqueado por:** QA-02
- [ ] Documentar y registrar 3 casos en el [Registro de IA](../04-gestion/ia-register.md)

**Aceptación:** entradas con validación.
