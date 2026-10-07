# Tareas 07 — Observabilidad y Pruebas

> Tareas de planificación: **TASK-012** (pruebas unitarias del MVP), **TASK-020** (observabilidad), **TASK-030** (alertas y simulacro), **TASK-021** (carga y DAST), **TASK-031** (UAT y usabilidad), **TASK-036** (colección de API), **TASK-037** (informe de pruebas). Marcar `[x]` solo al cumplir la [DoD](../../docs/04-gestion/equipo-y-flujo-de-trabajo.md#4-definición-de-hecho-dod).

## Fase 1 — Observabilidad en el backend · R6

| ☐ | # | Tarea | TS | Evidencia |
|:-:|:-:|:---|:---:|:---|
| [ ] | 1.1 | Dependencias de Actuator, Micrometer Prometheus y Micrometer Tracing/OTel | TS-05 | `/actuator/health` y `/actuator/prometheus` responden |
| [ ] | 1.2 | `TraceIdFilter` (+MDC, `X-Trace-Id`, `traceparent`) | TS-05 | CA-2 |
| [ ] | 1.3 | Logs JSON (test/prod) con el formato definido y texto en dev | TS-05 | CA-3 |
| [ ] | 1.4 | `GlobalExceptionHandler`: 500 genérico + `traceId`, *stacktrace* solo en log | TS-05 | CA-1 (TC-028) |
| [ ] | 1.5 | Contadores de negocio básicos (transiciones y solicitudes creadas) | TS-05 | CA-4 |
| [ ] | 1.6 | Exposición de Actuator restringida por perfil/red; `prometheus` no público | TS-05 | CA-4 (verificado desde fuera) |

## Fase 2 — Monitoreo y alertas · R6 (apoyo R3)

| ☐ | # | Tarea | TS | Evidencia |
|:-:|:-:|:---|:---:|:---|
| [ ] | 2.1 | `docker-compose.monitoring.yml` con Prometheus, Grafana y Jaeger (perfil `monitoring`) | TS-05 | CA-7 |
| [ ] | 2.2 | `prometheus.yml` y `alert-rules.yml` (3 alertas: instancia caída, error 5xx y BD inaccesible; ver [Observabilidad §6](../../docs/03-calidad-y-operacion/observabilidad.md#6-alertas)) | TS-05 | Reglas cargadas |
| [ ] | 2.3 | Dashboard provisionado de Salud del servicio | TS-05 | CA-7 |
| [ ] | 2.4 | **Simulacro de incidente** (detener backend / BD) y *post-mortem* en `docs/incidentes/` | TS-05 | CA-5, CA-6 |

## Fase 3 — Pruebas unitarias e integración (BE) · R6 con R2/R3

| ☐ | # | Tarea | TS | Evidencia |
|:-:|:-:|:---|:---:|:---|
| [x] | 3.1 | Base de pruebas: Testcontainers MySQL compartido, `Clock` fijo, *builders* | TS-06 | CA-10 |
| [x] | 3.2 | Unitarias de `AuthService` (login, registro y cambio de contraseña) — *con apoyo de IA, revisadas con la lista* | TS-06 | TC-001, 002, 004…006 |
| [ ] | 3.3 | Unitarias de `SolicitudWorkflowService`: transiciones válidas y las inválidas más comunes | TS-06 | TC-014…019 |
| [ ] | 3.4 | Unitarias de `FileTypeValidator`, `SlaCalculator`, `CodigoSolicitudService`, `AccessPolicy` | TS-06 | TC-007…011 |
| [ ] | 3.5 | Integración de persistencia: migraciones, triggers, constraints | TS-06 | TC-022 |
| [ ] | 3.6 | Integración del dashboard con dataset conocido | TS-06 | TC-024, TC-025 |
| [x] | 3.7 | Suite de autorización parametrizada (matriz completa) | TS-06 | CA-12 |

## Fase 4 — Pruebas frontend · R4 / R5

| ☐ | # | Tarea | TS | Evidencia |
|:-:|:-:|:---|:---:|:---|
| [x] | 4.1 | Configurar Vitest + Testing Library + MSW y cobertura | TS-06 | `npm test` en CI |
| [ ] | 4.2 | Pruebas de formularios (login, registro, nueva solicitud), `FileUploader`, `AuthContext`, rutas protegidas | TS-06 | CA-13 |
| [ ] | 4.3 | Pruebas de `AccionesSolicitud` (botones según `accionesPermitidas`) y de gráficos con datos vacíos | TS-06 | CA-13 |

## Fase 5 — Pruebas de API · R2 (apoyo R6)

| ☐ | # | Tarea | TS | Evidencia |
|:-:|:-:|:---|:---:|:---|
| [ ] | 5.1 | Colección Bruno única (auth, solicitudes, gestión, dashboard, admin) con entornos `dev`/`ci`/`staging` | TS-06 | CA-11 |
| [ ] | 5.2 | Ejecución de la colección en CI contra el stack Compose y tras cada despliegue a *staging* | TS-06 | CA-11 |

## Fase 6 — Carga y estrés · R6

| ☐ | # | Tarea | TS | Evidencia |
|:-:|:-:|:---|:---:|:---|
| [ ] | 6.1 | Sembrar ~2 000 solicitudes (`DemoDataSeeder` modo `carga`) | TS-07 | Conteo en BD |
| [ ] | 6.2 | Scripts k6: `setup` con tokens, escenario único con mezcla de login, solicitudes y dashboard, umbrales como código | TS-07 | CA-15 |
| [ ] | 6.3 | Ejecutar el perfil nominal (50 VU) y el de estrés (hasta 500 VU) | TS-07 | CA-15, 16 |
| [ ] | 6.4 | Identificar el cuello de botella (métricas / trazas) y aplicar al menos 1 mejora; repetir | TS-07 | Antes/después en el informe |
| [ ] | 6.5 | Redactar la sección de rendimiento del informe | TS-07 | CA-18 |

## Fase 7 — Aceptación, usuario e informe · R4 + R5 + R6

| ☐ | # | Tarea | TS | Evidencia |
|:-:|:-:|:---|:---:|:---|
| [ ] | 7.1 | Ejecutar UAT-01…UAT-06, UAT-09 y UAT-10 en *staging* con capturas | TS-06 | Tabla de resultados |
| [ ] | 7.2 | Pruebas de usabilidad con ≥ 5 usuarios ajenos y cuestionario SUS | RNF-05 | SUS ≥ 70 |
| [ ] | 7.3 | Revisión general de calidad: *hardcode*, N+1, manejo de errores; refactor posterior | RNF-08 | [Checklist de release §4](../../docs/05-entregables/informes-y-sustentacion.md#4-checklist-de-release-y-revisión-final) |
| [ ] | 7.4 | Redactar el **informe de pruebas** (solo las secciones de pruebas realmente ejecutadas) | TS-06 | `INFORME_PRUEBAS` |
| [ ] | 7.5 | Documentar 3 casos de pruebas generadas con IA (prompt → defectos → versión final) y registrarlos | TS-06 | Entradas en el [Registro de IA](../../docs/04-gestion/ia-register.md) |
