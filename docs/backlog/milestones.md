# Milestones del proyecto

> **Solo hay dos entregables**: la presentación de la semana 8 (**17/10**) y la de la semana 12 (**14/11**). Por eso las 4 fases del enunciado se agrupan en **2 fases** (`Fase 1` = I + II, `Fase 2` = III + IV), cada una dividida en **sub-milestones** (`1.1`…`1.6`, `2.1`…`2.8`) para terminar antes lo que otras tareas necesitan. Las fechas anteriores (31/10, 21/11, 12/12) **ya no se usan**. En GitHub se crean **14 milestones** con el nombre `<n.m> <título>` y la fecha de cierre indicada. Convenciones: [README](README.md).

> **Sprints** de 2 semanas: `S1` 05–17/10 (Fase 1) · `S2` 19–31/10 · `S3` 02–14/11 (Fase 2). Regla: **un issue nunca depende de otro de un milestone posterior**, y el `Límite` de cada issue es el cierre de su milestone.

> **Trabajo en paralelo.** El milestone **1.6** reúne tareas que *no* están en la ruta crítica del MVP pero pueden hacerse ya porque sus bloqueadores están en los milestones 1.1–1.5 (Dockerfiles y CI, observabilidad base, consultas del dashboard, componentes del frontend, springdoc…). Aprovechan a quien tiene menos carga en la Fase 1. Llevan la etiqueta `adelanto` y un **plan B**: si el 17/10 no están hechas, **pasan a su milestone original de la Fase 2** sin afectar la presentación del MVP.

> ⚠️ **Riesgo de capacidad:** la Fase 1 concentra 114 issues (de ellos 28 son adelantos opcionales) y la Fase 2 79. Si el avance real no alcanza, se aplica el [plan de contingencia](../04-gestion/calendario-y-contingencia.md#5-plan-de-contingencia-qué-se-recorta-y-en-qué-orden) (recortar primero notificaciones, comentarios, recuperación de contraseña y los opcionales).

## Resumen

| Milestone | Cierre | Sprint | Issues |
|:--|:-:|:-:|:-:|
| **1.1** Fundaciones técnicas | 06/10 | S1 | 9 |
| **1.2** Auth backend y base frontend | 08/10 | S1 | 18 |
| **1.3** Registro backend, UI de auth y maqueta | 11/10 | S1 | 21 |
| **1.4** Gestión backend y UI del flujo MVP | 14/10 | S1 | 25 |
| **1.5** Pruebas, E2E, informe y presentación de la Fase 1 | 16/10 | S1 | 13 |
| **1.6** Adelantos en paralelo (no bloquean el MVP) | 17/10 | S1 | 28 |
| **2.1** Decisión de cloud y entorno de staging | 23/10 | S2 | 3 |
| **2.2** Gestión completa, Dashboard y API documentada | 28/10 | S2 | 12 |
| **2.3** Administración, comentarios y cambio de contraseña | 31/10 | S2 | 22 |
| **2.4** Cloud, CD, hardening y Release Candidate | 04/11 | S3 | 15 |
| **2.5** Observabilidad, alertas e incidentes | 06/11 | S3 | 7 |
| **2.6** Carga, estrés, aceptación e informe de pruebas | 10/11 | S3 | 10 |
| **2.7** Manuales y release v1.0.0 | 12/11 | S3 | 6 |
| **2.8** Ensayo y sustentación final | 14/11 | S3 | 4 |

---

## Fase 1 · Fase 1 — Análisis, especificación, prototipo y construcción del MVP (fases I + II del enunciado)

**Presentación:** 17/10/2026 (semana 8)

**Producto:** Informe de la Fase 1, prototipo y **MVP funcional end-to-end** (Login → registrar → MySQL → consultar → modificar estado), tag `v0.5.0-mvp`.

### Milestone 1.1 — Fundaciones técnicas · cierre 06/10 · S1

| ID | Título | Rol |
|:--|:--|:-:|
| BASE-01 | DevOps - Ramas protegidas `main` y `develop` | R1 |
| BASE-02 | DevOps - `.gitignore`, `.env.example`, CODEOWNERS y Dependabot | R1 |
| BASE-03 | Backend - Proyecto Spring Boot, Flyway y conexión MySQL (TASK-002) | R3 |
| UX-01 | Diseño - Biblioteca de estilos y componentes en Figma | R4 |
| UX-08 | Diseño - Wireframes de baja fidelidad en Figma | R4 |
| IA-01 | Proceso - Sesión de equipo y acta de la regla de registro | R1 |
| IA-02 | Proceso - "¿Se usó IA? N° de entrada" en la plantilla de PR | R1 |
| IA-03 | Proceso - Auditoría semanal del registro (recurrente, hasta la semana 16) | R6 |
| IA-06 | Proceso - Registrar el uso de IA de cada módulo | R1 |

### Milestone 1.2 — Auth backend y base frontend · cierre 08/10 · S1

| ID | Título | Rol |
|:--|:--|:-:|
| BASE-04 | Frontend - Proyecto Vite + React, rutas y estructura | R5 |
| AUTH-01 | Backend - Entidades JPA, repositorio y `UsuarioDetails` (esqueleto de BD) | R1 |
| AUTH-02 | Backend - `JwtService` (HS256) | R1 |
| AUTH-03 | Frontend - `AuthContext` y persistencia de sesión | R4 |
| AUTH-04 | Frontend - Esquemas Zod (Login, Register, CambiarPassword) | R4 |
| AUTH-05 | Backend - `AuthController` con DTO y endpoints esqueleto | R1 |
| AUTH-06 | Backend - `PasswordEncoder` BCrypt(12) y validadores reutilizables | R2 |
| AUTH-07 | Backend - `JwtAuthenticationFilter` | R1 |
| AUTH-08 | Backend - `SecurityConfig` (stateless, CORS, 401/403 RFC 7807) | R1 |
| AUTH-09 | Backend - `GlobalExceptionHandler` (RFC 7807 con `traceId`) | R1 |
| AUTH-10 | Backend - `AuthService.login` | R1 |
| AUTH-11 | Backend - `AuthService.registrar` con rol forzado | R2 |
| AUTH-15 | Frontend - `apiClient` con interceptores y errores RFC 7807 | R4 |
| OPS-12 | CI - `ci.yml` con jobs `backend`, `frontend`, `docker-build` | R6 |
| QA-07 | Frontend - Vitest + Testing Library + MSW y cobertura | R4 |
| UX-02 | Diseño - Mockups de alta fidelidad W-01…W-09 | R4 |
| UX-03 | Diseño - Prototipo clicable (registro y asignación/resolución) | R4 |
| UX-04 | Frontend - `tokens.css` y *reset* base | R4 |

### Milestone 1.3 — Registro backend, UI de auth y maqueta · cierre 11/10 · S1

| ID | Título | Rol |
|:--|:--|:-:|
| BASE-05 | Backend - `DemoDataSeeder` (perfil `demo`) (TASK-025) | R3 |
| AUTH-16 | Frontend - `LoginPage` y redirección por rol | R4 |
| AUTH-17 | Frontend - `RegisterPage` con checklist de contraseña en vivo | R4 |
| AUTH-18 | Frontend - `ProtectedRoute` y `RoleRoute` | R5 |
| AUTH-19 | Frontend - Cierre de sesión en el menú de usuario | R4 |
| REG-01 | Backend - Entidades de solicitud y catálogos | R2 |
| REG-02 | Backend - DTO con Bean Validation y `@SinHtml` | R2 |
| REG-03 | Backend - Repositorios, `SolicitudSpecification` y proyecciones | R2 |
| REG-04 | Backend - `SlaCalculator` (función pura con `Clock`) | R2 |
| REG-05 | Backend - `CodigoSolicitudService` (código único) | R3 |
| REG-06 | Backend - `FileTypeValidator` | R3 |
| REG-07 | Backend - `FileStorageService` seguro | R3 |
| REG-08 | Backend - `SolicitudService.crear` transaccional | R3 |
| REG-09 | Backend - `POST /solicitudes` multipart | R2 |
| REG-10 | Backend - Límites multipart (y referencia a Nginx) | R2 |
| REG-14 | Backend - `GET /categorias` y `GET /prioridades` (activas) | R2 |
| REG-20 | Frontend - `EstadoBadge` y `PrioridadTag` accesibles | R5 |
| QA-01 | Backend - Base de pruebas (Testcontainers, `Clock` fijo, *builders*) | R6 |
| UX-05 | Frontend - Maqueta HTML/CSS/JS con `fetch` a `mock/*.json` (TASK-033) | R5 |
| UX-06 | Diseño - Verificación de contraste y tamaños táctiles | R4 |
| UX-07 | Diseño - Revisión heurística (Nielsen) y prueba informal con 2 personas | R5 |

### Milestone 1.4 — Gestión backend y UI del flujo MVP · cierre 14/10 · S1

| ID | Título | Rol |
|:--|:--|:-:|
| REG-11 | Backend - `GET /solicitudes/mis-solicitudes` | R2 |
| REG-12 | Backend - Detalle, historial y descarga de evidencia con `AccessPolicy` | R2 |
| REG-15 | Frontend - `NuevaSolicitudPage` | R4 |
| REG-16 | Frontend - Componente `FileUploader` | R4 |
| REG-17 | Frontend - Pantalla de confirmación con el código | R4 |
| REG-18 | Frontend - `MisSolicitudesPage` | R4 |
| REG-19 | Frontend - `SolicitudDetallePage` con `Timeline` y acciones | R4 |
| GES-01 | Backend - `Transicion` (enum con origen, destino y roles) | R2 |
| GES-02 | Backend - `AccessPolicy` (ver / ejecutar / `accionesPermitidas`) | R2 |
| GES-03 | Backend - `SolicitudWorkflowService.ejecutar` | R2 |
| GES-04 | Backend - `HistorialService` (solo inserción) | R3 |
| GES-05 | Backend - Pruebas de transiciones inválidas | R2 |
| GES-06 | Backend - `PUT /solicitudes/{id}/asignar` | R2 |
| GES-07 | Backend - `PUT /solicitudes/{id}/iniciar-atencion` | R2 |
| GES-08 | Backend - `PUT /solicitudes/{id}/resolver` (multipart) | R2 |
| GES-09 | Backend - `GET /solicitudes` (bandeja) y `GET …/historial` | R2 |
| GES-10 | Backend - `GET /usuarios/tecnicos` (también cubre Admin 2.5) | R2 |
| GES-16 | Frontend - `BandejaSupervisorPage` | R5 |
| GES-17 | Frontend - `BandejaTecnicoPage` (móvil primero) | R5 |
| GES-18 | Frontend - `ModalAsignacion` | R5 |
| GES-19 | Frontend - `ModalResolucion` con `FileUploader` | R5 |
| GES-21 | Frontend - `LineaTiempoHistorial` y `AccionesSolicitud` | R5 |
| DASH-01 | Backend - Dataset de prueba conocido | R3 |
| DASH-08 | Backend - DTO `KpisResponse`, `SerieItem`, `SerieEstadoItem` | R3 |
| UX-09 | Frontend - Cookie de preferencias `gu_prefs` (tema y estado del menú) | R5 |

### Milestone 1.5 — Pruebas, E2E, informe y presentación de la Fase 1 · cierre 16/10 · S1

| ID | Título | Rol |
|:--|:--|:-:|
| AUTH-21 | QA - Suite de autorización de auth (matriz rol × endpoint) | R6 |
| AUTH-22 | QA - La app no arranca sin `JWT_SECRET` (o con secreto corto) | R6 |
| REG-21 | QA - Integración del alta (éxito y rollback) | R2 |
| REG-22 | QA - Pruebas de seguridad del alta | R6 |
| QA-00 | E2E - Validación del flujo MVP en ambiente integrado (TASK-013) | R6 |
| QA-02 | Backend - Unitarias de `AuthService` | R3 |
| QA-03 | Backend - Unitarias de `SolicitudWorkflowService` | R2 |
| QA-04 | Backend - Unitarias de `FileTypeValidator`, `SlaCalculator`, `CodigoSolicitudService`, `AccessPolicy` | R2 |
| QA-05 | Backend - Integración de persistencia (migraciones, triggers, constraints) | R3 |
| QA-08 | Frontend - Pruebas de formularios, `FileUploader`, `AuthContext` y rutas | R4 |
| DOC-01 | Informe de la Fase I (primera parte del informe de la Fase 1) (TASK-026) | R1 |
| DOC-02 | Informe de la Fase 1 (fases I + II) y tag `v0.5.0-mvp` (TASK-014) | R1 |
| DOC-17 | Presentación de la Fase 1 (fases I + II) y demostración del MVP | R4 |

### Milestone 1.6 — Adelantos en paralelo (no bloquean el MVP) · cierre 17/10 · S1

| ID | Título | Rol |
|:--|:--|:-:|
| AUTH-12 | Backend - `cambiarPassword` *(plan B → 2.3)* | R2 |
| DASH-02 | Backend - `DashboardRepository.kpis` (una sola consulta) *(plan B → 2.2)* | R3 |
| DASH-03 | Backend - Series por categoría, prioridad, estado y responsable *(plan B → 2.2)* | R3 |
| DASH-04 | Backend - Consulta de vencidas paginada *(plan B → 2.2)* | R3 |
| DASH-06 | Backend - `ScopeResolver` *(plan B → 2.2)* | R3 |
| DASH-07 | Backend - `DashboardService` *(plan B → 2.2)* | R3 |
| DASH-09 | Backend - `DashboardController` (6 endpoints) *(plan B → 2.2)* | R3 |
| DASH-10 | Frontend - `DashboardPage` con filtros y estados por widget *(plan B → 2.2)* | R5 |
| DASH-11 | Frontend - `KpiCard` y rejilla responsive *(plan B → 2.2)* | R5 |
| DASH-12 | Frontend - Gráficos (Recharts) *(plan B → 2.2)* | R5 |
| ADM-12 | Frontend - Hook `useCrud` genérico *(plan B → 2.3)* | R5 |
| ADM-14 | Frontend - `DataTable` reutilizable *(plan B → 2.3)* | R5 |
| OPS-01 | Backend - `Dockerfile` multi-stage *(plan B → 2.1)* | R6 |
| OPS-02 | Frontend - `Dockerfile` multi-stage (Node → Nginx) *(plan B → 2.1)* | R5 |
| OPS-03 | `docker-compose.yml` base *(plan B → 2.1)* | R6 |
| OPS-04 | Overrides `dev` y `prod` de Compose *(plan B → 2.1)* | R6 |
| OPS-05 | Nginx como API Gateway (`default.conf`) *(plan B → 2.1)* | R5 |
| OPS-06 | Probar `docker compose up --build` en máquina limpia *(plan B → 2.1)* | R6 |
| OPS-07 | Backend - `application.yml` solo con `${VARIABLES}` *(plan B → 2.4)* | R1 |
| OPS-10 | Backend - Verificar CORS por `ALLOWED_ORIGINS` *(plan B → 2.4)* | R1 |
| OPS-13 | CI - JaCoCo y Vitest con umbrales de cobertura *(plan B → 2.1)* | R6 |
| OPS-14 | CI - Caché de Maven y npm, `npm test = vitest run` *(plan B → 2.1)* | R6 |
| OPS-15 | CI - Reglas de protección con checks requeridos *(plan B → 2.2)* | R6 |
| OPS-16 | CI - `security.yml` (CodeQL y gitleaks) *(plan B → 2.2)* | R6 |
| OPS-27 | Backend - springdoc y `OpenApiConfig` *(plan B → 2.2)* | R3 |
| OBS-01 | Backend - Actuator, Micrometer Prometheus y Tracing/OTel *(plan B → 2.5)* | R6 |
| OBS-02 | Backend - `TraceIdFilter` (MDC, `X-Trace-Id`, `traceparent`) *(plan B → 2.5)* | R6 |
| OBS-03 | Backend - Logs JSON (test/prod) y texto en dev *(plan B → 2.5)* | R6 |

---

## Fase 2 · Fase 2 — APIs, nube, DevOps, seguridad, calidad, observabilidad y entrega (fases III + IV del enunciado)

**Presentación:** 14/11/2026 (semana 12)

**Producto:** Aplicación desplegada, API documentada, CI/CD, seguridad, pruebas, observabilidad, manuales, release `v1.0.0` y sustentación final.

### Milestone 2.1 — Decisión de cloud y entorno de staging · cierre 23/10 · S2

| ID | Título | Rol |
|:--|:--|:-:|
| OPS-20 | Decidir la plataforma cloud (ADR-007) | R1 |
| OPS-21 | Aprovisionar VM/servicios, TLS, dominio y *firewall* | R6 |
| OPS-22 | GitHub Environments `staging` y `production` | R6 |

### Milestone 2.2 — Gestión completa, Dashboard y API documentada · cierre 28/10 · S2

| ID | Título | Rol |
|:--|:--|:-:|
| GES-11 | Backend - `PUT /solicitudes/{id}/evaluar` | R2 |
| GES-13 | Backend - `PUT …/cerrar` | R2 |
| GES-14 | Backend - `@PreAuthorize` y `@Operation` en cada endpoint | R2 |
| GES-24 | QA - Suite de autorización completa del módulo | R6 |
| DASH-13 | Frontend - `VencidasTable` | R4 |
| DASH-14 | Frontend - Estados vacío/error/carga y MTTR "—" | R5 |
| DASH-15 | Frontend - Visibilidad por rol | R5 |
| DASH-17 | QA - Prueba de alcance con dos áreas | R3 |
| DASH-19 | QA - Pruebas de componente de gráficos | R5 |
| OPS-28 | Backend - `@Operation`, `@ApiResponse` y ejemplos en el 100 % de endpoints | R2 |
| QA-06 | Backend - Integración del dashboard con dataset conocido | R3 |
| QA-10 | Frontend - Pruebas de `AccionesSolicitud` y gráficos con datos vacíos | R5 |

### Milestone 2.3 — Administración, comentarios y cambio de contraseña · cierre 31/10 · S2

| ID | Título | Rol |
|:--|:--|:-:|
| GES-15 | Backend - Comentarios (`GET/POST …/comentarios`) | R3 |
| GES-22 | Frontend - `ComentariosPanel` | R4 |
| ADM-01 | Backend - Entidad `Area` y consultas de activos | R3 |
| ADM-02 | Backend - `CategoriaService` | R3 |
| ADM-03 | Backend - `AreaService` | R3 |
| ADM-04 | Backend - `PrioridadService` | R3 |
| ADM-05 | Backend - `EstadoService` (solo presentación) | R3 |
| ADM-06 | Backend - Controladores de catálogos | R3 |
| ADM-07 | Backend - `AdminUsuarioService` | R3 |
| ADM-08 | Backend - Protecciones: último admin y auto-desactivación | R3 |
| ADM-10 | Backend - `AdminUsuariosController` y `RolController` | R3 |
| ADM-11 | Backend - Logs de auditoría de administración | R3 |
| ADM-13 | Frontend - `AdminLayout` y rutas `/admin/*` | R5 |
| ADM-15 | Frontend - Pantallas de Categorías y Áreas | R5 |
| ADM-16 | Frontend - Pantalla de Prioridades (SLA) | R5 |
| ADM-17 | Frontend - Pantalla de Estados (solo presentación) | R5 |
| ADM-18 | Frontend - Pantalla de Usuarios | R5 |
| ADM-19 | Frontend - `ConfirmDialog` accesible | R4 |
| ADM-20 | Frontend - Refrescar la caché de catálogos | R5 |
| ADM-21 | QA - Baja lógica de categoría | R5 |
| ADM-22 | QA - Autorización: solo `ADMIN` escribe | R6 |
| ADM-23 | QA - Desactivar usuario corta el acceso | R3 |

### Milestone 2.4 — Cloud, CD, hardening y Release Candidate · cierre 04/11 · S3

| ID | Título | Rol |
|:--|:--|:-:|
| OPS-08 | Backend - Auditoría de `@Valid` en todos los POST/PUT | R2 |
| OPS-09 | QA - `@SinHtml` en todo texto libre y payloads de prueba | R6 |
| OPS-11 | Backend - Lista blanca de ordenamiento y tope de paginación | R2 |
| OPS-31 | Backend - Swagger, errores detallados y Actuator restringidos en `prod` | R1 |
| OPS-32 | Checklist de hardening firmado (TASK-019) | R1 |
| OPS-17 | DAST - ZAP *baseline* tras desplegar a *staging* | R6 |
| OPS-23 | `cd-staging.yml` (GHCR, SSH, *smoke test*) | R6 |
| OPS-24 | `cd-prod.yml` (despliegue por tag y *smoke test*) | R1 |
| OPS-33 | Ambientes desarrollo / prueba / producción | R1 |
| OPS-34 | Docs - Panorama de GraphQL / gRPC / webhooks y API Gateway | R2 |
| QA-11 | API - Colección Bruno única y entornos `dev`/`ci`/`staging` | R2 |
| QA-12 | API - Ejecutar la colección en CI y tras cada despliegue a *staging* | R2 |
| QA-24 | IA - 3 casos de pruebas generadas con IA (prompt → defectos → versión final) | R6 |
| DOC-03 | Release Candidate `v0.9.0-rc.1` desplegado en *staging* (TASK-039) | R1 |
| DOC-16 | Evidencias de la Fase III (Release Candidate) | R1 |

### Milestone 2.5 — Observabilidad, alertas e incidentes · cierre 06/11 · S3

| ID | Título | Rol |
|:--|:--|:-:|
| OBS-04 | Backend - 500 genérico con `traceId` (sin *stacktrace* al cliente) | R3 |
| OBS-06 | Backend - Métricas de negocio | R3 |
| OBS-07 | DevOps - Actuator restringido; `prometheus` no público | R6 |
| OBS-09 | DevOps - `docker-compose.monitoring.yml` (Prometheus + Grafana + Jaeger) | R6 |
| OBS-10 | DevOps - `prometheus.yml` y `alert-rules.yml` | R6 |
| OBS-11 | DevOps - Dashboard de Grafana provisionado | R6 |
| OBS-13 | Simulacro de incidente y *post-mortem* | R6 |

### Milestone 2.6 — Carga, estrés, aceptación e informe de pruebas · cierre 10/11 · S3

| ID | Título | Rol |
|:--|:--|:-:|
| QA-14 | Rendimiento - Sembrar ~2 000 solicitudes (`DemoDataSeeder` modo `carga`) | R3 |
| QA-15 | Rendimiento - Scripts k6 (`setup` con tokens, escenario único, umbrales) | R6 |
| QA-16 | Rendimiento - Ejecutar el perfil nominal (50 VU) y el de estrés (hasta 500 VU) | R6 |
| QA-17 | Rendimiento - Identificar el cuello de botella y aplicar al menos 1 mejora | R3 |
| QA-18 | Rendimiento - Sección de rendimiento del informe | R3 |
| QA-19 | UAT - Ejecutar UAT-01…UAT-06 en *staging* con capturas | R4 |
| QA-20 | UAT - Ejecutar UAT-09 y UAT-10 en *staging* con capturas | R5 |
| QA-21 | UX - Pruebas de usabilidad con ≥ 5 usuarios y cuestionario SUS | R4 |
| QA-22 | Calidad - Revisión general (hardcode, N+1, manejo de errores) y refactor | R1 |
| QA-23 | Docs - Informe de pruebas | R6 |

### Milestone 2.7 — Manuales y release v1.0.0 · cierre 12/11 · S3

| ID | Título | Rol |
|:--|:--|:-:|
| IA-05 | Docs - Lecciones aprendidas (proyecto y uso de IA) | R1 |
| DOC-04 | Manual de usuario con capturas (4 roles) | R4 |
| DOC-05 | Manual técnico y guía de instalación | R1 |
| DOC-08 | Checklist de release y revisión final | R1 |
| DOC-09 | Verificar el ciclo Especificar → … → Mejorar | R1 |
| DOC-10 | Congelamiento, regresión final y tag `v1.0.0` (TASK-023) | R1 |

### Milestone 2.8 — Ensayo y sustentación final · cierre 14/11 · S3

| ID | Título | Rol |
|:--|:--|:-:|
| DOC-11 | Ambiente de demo (seed reproducible) | R3 |
| DOC-12 | Presentación y guion de la demostración | R4 |
| DOC-13 | Ensayo general cronometrado (TASK-038) | R1 |
| DOC-15 | Subir el informe final y sustentación (TASK-024) | R1 |
