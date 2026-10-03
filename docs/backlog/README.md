# Backlog de Issues (GitHub)

> Backlog **completo** para cumplir el enunciado *"Sistema Web Inteligente para la Gestión Integral de Servicios Universitarios"*. Se genera a partir de los `specs/*/03-tasks.md`, [`calendario-y-contingencia.md`](../04-gestion/calendario-y-contingencia.md) y las 4 fases del PDF. **1 Issue = 1 responsable = 1 tarea (o un grupo muy pequeño y relacionado).**
>
> **Calendario vigente:** solo hay **dos entregables**, la presentación de la semana 8 (**17/10**, fases I + II del enunciado) y la de la semana 12 (**14/11**, fases III + IV). Las fechas anteriores (31/10, 21/11, 12/12) ya no se usan. Detalle en [`milestones.md`](milestones.md).

## Archivos

**Empieza por [`milestones.md`](milestones.md)**: agrupa los 193 issues en las 2 fases vigentes y sus 14 sub-milestones (`1.1`…`1.6`, `2.1`…`2.8`).

| Archivo | Épica / prefijo | Issues |
|:---|:---|:---:|
| [01-base-y-auth.md](01-base-y-auth.md) | `BASE` (repo, BD, scaffolding) · `AUTH` (Módulo 1) | 24 |
| [02-registro.md](02-registro.md) | `REG` (Módulo 2) | 21 |
| [03-gestion.md](03-gestion.md) | `GES` (Módulo 3) | 21 |
| [04-dashboard.md](04-dashboard.md) | `DASH` (Módulo 4) | 16 |
| [05-administracion.md](05-administracion.md) | `ADM` (Módulo 5) | 22 |
| [07-devops-seguridad.md](07-devops-seguridad.md) | `OPS` (Docker, CI/CD, cloud, OWASP, OpenAPI) | 28 |
| [08-observabilidad-testing.md](08-observabilidad-testing.md) | `OBS` · `QA` (logs, métricas, alertas, pruebas, k6, UAT) | 33 |
| [09-entregables-ia.md](09-entregables-ia.md) | `UX` · `IA` · `DOC` (diseño, registro de IA, informes, manuales, sustentación) | 28 |

**Total: 193 issues.**

## Formato de cada Issue

```
### <ID> · [Módulo] <Frontend|Backend|...> - <Nombre corto>
Rol · Labels · Sprint · Milestone · Límite · Bloqueado por
<descripción de una línea>
- [ ] tareas
Aceptación / evidencia
```

- **Título en GitHub:** el texto entre `·` y el final, p. ej. `[Auth] Backend - JwtService (HS256)`.
- **ID** (`AUTH-02`): sirve como referencia mientras no exista el número de GitHub; se agrega a la descripción del issue y a `Bloqueado por` como `#N` al crearlos.
- **Rol:** R1 Tech Lead/SM · R2 Backend 1 · R3 Backend 2/DBA · R4 Frontend 1 · R5 Frontend 2 · R6 QA/DevOps/Seguridad.
- **Milestone:** 2 fases (`Fase 1` = fases I+II del enunciado, cierre **17/10**; `Fase 2` = fases III+IV, cierre **14/11**) divididas en 14 sub-milestones `1.1`…`1.6` y `2.1`…`2.8` (ver [`milestones.md`](milestones.md)). Lo que otras tareas necesitan va en un sub-milestone anterior; un issue nunca depende de otro de un milestone posterior; el `Límite` de cada issue es el cierre de su milestone.
- **Sprint:** S1 05–17/10 · S2 19–31/10 · S3 02–14/11.
- **Prioridad:** `M` Must · `S` Should (se recorta primero, [Calendario §5](../04-gestion/calendario-y-contingencia.md#5-plan-de-contingencia-qué-se-recorta-y-en-qué-orden)) · `C` Could. Sin marca = `M`.

## Reglas de paralelismo (Frontend ↔ Backend)

1. **El Frontend nunca queda bloqueado por el Backend.** Cada Issue `Frontend` indica el contrato de [`docs/02-diseno/api-rest.md`](../02-diseno/api-rest.md) (JSON, códigos, errores RFC 7807) y trabaja con **MSW / `mock/*.json`** hasta que el endpoint exista.
2. La integración real es un paso explícito: el Issue `FE-INT` de cada módulo (o el checkbox final "Sustituir mock por `apiClient`") se cierra cuando el endpoint está en `develop`.
3. El Backend publica primero **DTO y endpoints esqueleto** (p. ej. `AUTH-05`) para que el contrato sea consultable por Swagger.
4. Dentro del Backend: Fase 2 (seguridad) depende de Fase 1 (entidades); Fase 3 (servicios) de la 2; Fase 4 (controlador) de la 3, salvo el esqueleto.
5. Dentro del Frontend: UI de páginas (5.4, 5.5…) depende de **Zod** (`AUTH-04`) y **AuthContext** (`AUTH-03`).

## Tareas fusionadas (para no duplicar issues)

| Tarea en `03-tasks.md` | Se resuelve en |
|:---|:---|
| Auth 2.3 (CORS) y DevOps 2.4 | `AUTH-08` (DevOps 2.4 verifica en `OPS-10`) |
| Auth 4.2 y DevOps 2.2 / Obs 1.4 | `AUTH-09` crea el handler; `OPS-08` audita `@Valid`; `OBS-04` añade el 500 genérico |
| Gestión 2.5 y Admin 2.5 (`/usuarios/tecnicos`) | `GES-10` |
| Gestión 5.5 y Obs 1.6 (métricas de negocio) | `OBS-06` |
| DevOps 3.2 (umbrales de cobertura) | `OPS-13` |
| Obs 3.9 (matriz de autorización) | `GES-24`, `AUTH-21`, `ADM-22` (se cierran allí) |
| Entregables 4.3 y Obs 7.4 (informe de pruebas) | `QA-23` |
| Registrar uso de IA en cada módulo (`x.5`/`x.6`) | `IA-06` (un checkbox por módulo) |
| Tareas de roadmap sin fila en `03-tasks.md` (TASK-002, 013, 025, 039) | `BASE-03`, `QA-00`, `BASE-05`, `DOC-03` |
| Wireframes (Entregables 1.1) | Documentados en texto (UX §5); el entregable visual en Figma es `UX-08` |

## Mapa de cobertura del enunciado (PDF)

| Requisito del PDF | Issues |
|:---|:---|
| Módulo 1 Autenticación (login, registro, JWT, cambio de contraseña, roles) | `AUTH-*`, `ADM-07`, `ADM-08`, `ADM-10` |
| Módulo 2 Registro de solicitudes (código, categoría, ubicación, prioridad, evidencias) | `REG-*` |
| Módulo 3 Gestión (estados, asignación, comentarios) | `GES-*` |
| Módulo 4 Dashboard (9 indicadores) | `DASH-*` |
| Módulo 5 Administración (usuarios, roles, categorías, prioridades, estados, áreas) | `ADM-*` |
| Historias, épicas, specs, BDD, tareas | Hechas en `specs/`; informes `DOC-01`, `DOC-02` |
| UI/UX: wireframes, mockups, prototipo, DOM/CSS/JS, responsive, usabilidad | `UX-01…UX-08`, `QA-21` |
| React, Spring Boot, DTO, capas, MySQL, CRUD, `fetch`, estado, `localStorage`/`sessionStorage`, cookies | `BASE-*`, `AUTH-03`, `REG-15`, `ADM-12`; cookies: `UX-09` (ver [ADR-004](../02-diseno/decisiones-arquitectura.md#adr-004--jwt-de-8-horas-sin-refresh-token)), citado en `DOC-02` |
| MVP E2E "Login → registrar → MySQL → consultar → modificar estado" | `QA-00` |
| Cloud, Docker, ambientes (dev/prueba/prod), Git/ramas, CI/CD | `BASE-01/02`, `OPS-01…06`, `OPS-12…15`, `OPS-20…24`, `OPS-33` |
| API REST (rutas, códigos, documentación, pruebas, GraphQL/gRPC/webhooks, API Gateway) | `OPS-27`, `OPS-28`, `OPS-34` (panorama GraphQL/gRPC/webhooks), `OPS-05` (gateway Nginx), `QA-11/12` |
| Seguridad (authN/authZ, JWT, validación, secretos, OWASP) | `AUTH-06…09`, `OPS-07…11`, `OPS-16`, `OPS-17` |
| Testing (unitarias, integración, API, IA en pruebas) | `QA-01…QA-12`, `QA-24` |
| SAST / DAST | `OPS-16`, `OPS-17` |
| Carga y estrés | `QA-14…18` |
| Informe de pruebas | `QA-23` |
| Observabilidad (logs, métricas, trazas, alertas, incidentes) | `OBS-*` |
| Calidad y revisión final | `QA-22`, `DOC-08`, `DOC-09` |
| Release, manuales, repositorio, presentación, demo | `DOC-*` |
| Registro de uso de IA | `IA-*` |
| Demostrar en la Fase III: desplegada, API documentada, CI/CD, authN/authZ, seguridad, pruebas | `DOC-16` (índice de evidencias) |

## Alcance recortado

Tareas que **no vienen del enunciado** se eliminaron del backlog el 03/10/2026 para aliviar la carga del equipo (se mantiene `IA-03`, porque el Registro de IA sí lo exige el enunciado):

| Recortado | Era | Qué queda |
|:---|:-:|:---|
| Triaje semanal de hallazgos de seguridad | `OPS-19` | Los hallazgos se revisan al revisar cada PR y se resumen en el informe de pruebas |
| Prueba real de *rollback* con medición de tiempo | `OPS-25` | El procedimiento (redesplegar el *tag* anterior) sigue documentado en [DevOps](../03-calidad-y-operacion/devops-despliegue.md); el criterio CA-15 de la spec 06 queda sin verificación |
| Loki/Promtail y colector OTLP/Tempo | `OBS-14` | Se mantienen logs JSON con `traceId`, Prometheus, Grafana y las alertas |
| Plan B de la demo (video y capturas) | `DOC-14` | Sin respaldo grabado: el ensayo (`DOC-13`) debe confirmar conectividad y ambiente |
| Auditorías Lighthouse de accesibilidad | `QA-13`, `DASH-16` | La accesibilidad se revisa a mano con la lista de verificación (contraste, foco, etiquetas, teclado); sin informe Lighthouse |
| Prueba de contrato OpenAPI en CI | `OPS-29` | Swagger y el `openapi.yaml` exportado por *release* (ahora un checkbox de `OPS-28`) |
| Sincronización manual de `api-rest.md` | `OPS-30` | Se corrige el documento cuando se detecte una diferencia, sin tarea dedicada |
| Consolidación de suites y reporte JaCoCo | `QA-09` | Las pruebas siguen en sus issues; el reporte de cobertura lo publica el CI (`OPS-13`) |
| Respaldo diario de BD y restauración probada | `OPS-26` | El ambiente de demo se recrea con el *seed* reproducible (`DOC-11`); sin respaldos automáticos |
| ZAP *full scan* autenticado | `OPS-18` | Se mantiene el DAST con ZAP *baseline* (`OPS-17`), que cubre lo que pide el enunciado |
| Notificaciones dentro de la aplicación (campana, panel, *polling*) | `NOT-01…NOT-11` | El usuario ve el estado en "Mis solicitudes"; el historial sigue mostrando cada cambio |
| Recuperación de contraseña por correo | `AUTH-13`, `AUTH-20` | Se conserva el cambio de contraseña (`AUTH-12`) |
| Desbloqueo de cuentas (y bloqueo por intentos fallidos) | `ADM-09` | *Rate limit* por IP en Nginx |
| Logs de eventos de seguridad y su verificación | `AUTH-14`, `AUTH-23`, `OBS-05` | Logs JSON con `traceId`; los PR cuidan que no se registren contraseñas |
| Estados `Rechazada` y `Cancelada`, reabrir y calificación | `GES-12`, `GES-20`, `REG-13` (y la parte de reabrir de `GES-13`) | Los 6 estados del enunciado; `GES-13` queda solo en cerrar |
| Manejo especial del 409 en el frontend | `GES-23` | Mensaje de error genérico del `apiClient` |
| Pruebas de concurrencia y atomicidad de transiciones | `GES-25`, `GES-26` | `@Transactional` y la prueba de rollback del alta (`REG-21`) |
| `EXPLAIN` y escenario k6 con 10 000 filas del dashboard | `DASH-05`, `DASH-18` | ~2 000 filas y el escenario k6 común (`QA-15`) |
| Colecciones Bruno y escenarios k6 separados por módulo | `AUTH-24`, `REG-23`, `REG-24`, `GES-27`, `DASH-20`, `ADM-24` | Una colección Bruno (`QA-11`) y un escenario k6 (`QA-15`) |
| Código de soporte en errores 5xx y canal de notificación de alertas | `OBS-08`, `OBS-12` | `traceId` en las respuestas de error y alertas visibles en Grafana |
| Estadística de IA por fase, README con badges y prueba del manual con una persona nueva | `IA-04`, `DOC-06`, `DOC-07` | Registro de IA, lecciones aprendidas (`IA-05`) y los manuales |

## Carga por rol

Reparto de los 193 issues tras equilibrar la asignación original de las specs (que dejaba a R6 con 74 y a R3 con solo 4 en la Fase 1). Los issues de pruebas se asignan, siempre que es posible, al rol que construyó lo que se prueba; R6 conserva DevOps, seguridad, observabilidad de infraestructura y la coordinación de calidad.

| Rol | Total | Fase 1 (hasta 17/10) | Fase 2 (hasta 14/11) | Foco (issues por épica) |
|:---|:-:|:-:|:-:|:---|
| **R1 Tech Lead / SM** | 31 | 16 | 15 | DOC 10, AUTH 7, OPS 7, IA 4, BASE 2, QA 1 |
| **R2 Backend 1** | 33 | 24 | 9 | GES 12, REG 10, OPS 4, QA 4, AUTH 3 |
| **R3 Backend 2 / DBA** | 38 | 18 | 20 | ADM 11, DASH 9, QA 6, REG 4, BASE 2, GES 2, OBS 2, OPS 1, DOC 1 |
| **R4 Frontend 1** | 27 | 20 | 7 | AUTH 6, UX 6, REG 5, QA 4, DOC 3, GES 1, DASH 1, ADM 1 |
| **R5 Frontend 2** | 30 | 18 | 12 | ADM 9, DASH 6, GES 5, UX 3, OPS 2, QA 2, BASE 1, AUTH 1, REG 1 |
| **R6 QA / DevOps / Seguridad** | 34 | 18 | 16 | OPS 14, OBS 8, QA 6, AUTH 2, REG 1, GES 1, ADM 1, IA 1 |

> Se revisa en cada *Sprint Planning*; si un rol excede su capacidad se mueve un issue **antes** de comprometer el sprint.

## Equivalencia `TASK` → issues

La planificación original usaba 39 tareas `TASK-xxx` (siguen apareciendo como etiqueta en los issues y en las specs). Esta tabla, **orientativa**, indica qué issues del backlog las cubren; los issues sin `TASK` (p. ej. `IA-*`, `UX-09`, `OPS-33`) son tareas nuevas derivadas del enunciado.

| Tarea | Descripción original | Issues |
|:---|:---|:---|
| TASK-001 | Inicializar repo, branch protection (main, develop), plantillas de issue/PR y… | BASE-01, BASE-02, OPS-12 |
| TASK-002 | Aplicar V1/V2 con Flyway, configurar datasource y HikariCP; ddl-auto=validate | BASE-03 |
| TASK-003 | Wireframes → mockups → prototipo clicable en Figma y tokens.css base | UX-01…UX-04, UX-08 |
| TASK-004 | Spring Security 6, BCrypt 12, JWT HS256, JwtAuthenticationFilter, GlobalExcep… | AUTH-01…AUTH-11 |
| TASK-005 | Login y Registro en React, AuthContext, apiClient con interceptores | AUTH-15…AUTH-19 |
| TASK-006 | Entidades JPA (Solicitud, Categoria, Prioridad, Estado…) y DTO record con Bea… | REG-01…REG-04 |
| TASK-007 | POST /solicitudes multipart, CodigoSolicitudService (ADR-011), FileStorageSer… | REG-05…REG-10, REG-14 |
| TASK-008 | Formulario "Nueva solicitud" (validación, contador, drag & drop, vista previa… | REG-11, REG-12, REG-15…REG-20 |
| TASK-009 | SolicitudWorkflowService (tabla de transiciones, AccessPolicy) + historial | GES-01…GES-05 |
| TASK-010 | Endpoints asignar, iniciar-atencion, resolver, GET /solicitudes, /historial,… | GES-06…GES-10 |
| TASK-011 | Bandeja (supervisor/técnico), detalle con timeline, modales de asignación y r… | GES-16…GES-19, GES-21 |
| TASK-012 | Pruebas unitarias de Auth y Workflow (JUnit 5 + Mockito); integración con Tes… | QA-02…QA-05 |
| TASK-013 | Validación E2E del flujo MVP en ambiente integrado | QA-00 |
| TASK-014 | Informe de la Fase 1 (I + II), tag v0.5.0-mvp y presentación del 17/10 | DOC-02, DOC-17 |
| TASK-015 | Dockerfiles multi-stage, docker-compose (+ overrides), .env.example, Nginx | OPS-01…OPS-06 |
| TASK-016 | Consultas agregadas y endpoints /dashboard/ con alcance por rol (RN-11, RN-16) | DASH-01…DASH-04, DASH-06…DASH-09 |
| TASK-017 | Dashboard React (KPIs, gráficos Recharts, filtros de fecha, vencidas) | DASH-10…DASH-15 |
| TASK-018 | CRUD de usuarios, roles, áreas, categorías, prioridades y presentación de est… | ADM-01…ADM-08, ADM-10…ADM-23 |
| TASK-019 | Hardening OWASP: CSP/CORS/cabeceras, rate limit, revisión de secretos y check… | OPS-07…OPS-11, OPS-31, OPS-32 |
| TASK-020 | Logs JSON con traceId, Micrometer + OTel, Prometheus/Grafana, dashboards | OBS-01…OBS-04, OBS-06, OBS-07, OBS-09, OBS-11 |
| TASK-021 | Carga y estrés (k6) (§8 de pruebas) y DAST (ZAP) baseline | QA-14…QA-18, OPS-17 |
| TASK-022 | Manual de usuario, manual técnico, guía de despliegue | DOC-04, DOC-05 |
| TASK-023 | Congelamiento, regresión final, revisión de arquitectura/código/IA, tag v1.0.0 | DOC-08…DOC-10, QA-22 |
| TASK-024 | Presentación 2 y sustentación final: informe final + demostración integral | DOC-15 |
| TASK-025 | DemoDataSeeder (perfil demo) con 4 roles y solicitudes de ejemplo; verificar V2 | BASE-05 |
| TASK-026 | Informe de Fase I (12 ítems de la presentación) y diapositivas | DOC-01 |
| TASK-027 | OpenAPI/Swagger con springdoc, openapi.yaml versionado, ejemplos y códigos | OPS-27, OPS-28 |
| TASK-028 | Elegir cloud (ADR-007), aprovisionar, cd-staging.yml y cd-prod.yml, smoke tests | OPS-20…OPS-24 |
| TASK-029 | security.yml: CodeQL y gitleaks; Dependabot | OPS-16, BASE-02 |
| TASK-030 | 3 alertas y simulacro de incidente con post-mortem | OBS-10, OBS-13 |
| TASK-031 | UAT (UAT-01…12) y pruebas de usabilidad con ≥ 5 usuarios (SUS) | QA-19…QA-21 |
| TASK-032 | Cambiar contraseña | AUTH-12 |
| TASK-033 | Maqueta HTML/CSS/JS con fetch a API simulada ([UX §6.2](ux-ui-prototipo.md#62… | UX-05…UX-07 |
| TASK-034 | Evaluar y cerrar solicitudes (BE + FE) | GES-11, GES-13 |
| TASK-035 | Comentarios (públicos/privados) (BE + FE) | GES-15, GES-22 |
| TASK-036 | Colección de API (Bruno) | QA-11, QA-12 |
| TASK-037 | Informe de pruebas (INFORME_PRUEBAS) completo | QA-23 |
| TASK-038 | Ensayo general y ambiente de demo limpio con seed | DOC-11…DOC-13 |
| TASK-039 | Release Candidate v0.9.0-rc.1 desplegado en staging | DOC-03, DOC-16 |

## Gestión en GitHub Projects

| Elemento | Convención |
|:---|:---|
| **Tablero** | Columnas: `Backlog` · `Sprint` · `En progreso` · `En revisión` · `En pruebas` · `Hecho` |
| **Milestones** | 14 sub-milestones: Fase 1 = `1.1`…`1.6` (cierre 17/10) y Fase 2 = `2.1`…`2.8` (cierre 14/11); ver [`milestones.md`](milestones.md) |
| **Etiquetas** | `HU-xx`, `US-xx`, `TS-xx`, `TASK-xxx`, `backend`, `frontend`, `db`, `devops`, `seguridad`, `docs`, `bug`, prioridad `M/S/C`, `bloqueado` |
| **Issues** | Uno por entrada del backlog (ID `AUTH-02`, `REG-05`… en la descripción) con la plantilla de [historia de usuario](../../.github/ISSUE_TEMPLATE/feature_story.md) |
| **Ramas** | `feature/HU-xx-slug` o `feature/US-xx-slug` ([Gobernanza](../04-gestion/equipo-y-flujo-de-trabajo.md)) |
| **Estimación** | Puntos de historia (1, 2, 3, 5, 8); si una US > 5, se divide |
| **Seguimiento** | *Burndown* por sprint y revisión de bloqueos en cada *daily* |
