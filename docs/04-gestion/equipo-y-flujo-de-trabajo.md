# Equipo y flujo de trabajo

> Reúne **cómo se organiza el equipo** (Parte A: roles, carga, ceremonias, RACI) y **cómo se trabaja en el repositorio** (Parte B: ramas, commits, Pull Requests, Definición de Hecho, versionado).

---

## Parte A — Organización del Equipo, Roles y Ceremonias Ágiles

> **Metodología:** Scrum adaptado a un ciclo académico, con sprints de 2 semanas ([calendario](calendario-y-contingencia.md#2-sprints)).
> **Composición supuesta:** 6 integrantes con roles técnicos especializados (el enunciado no fija el tamaño; ver [§4](#4-si-el-equipo-no-es-de-6-integrantes)).
> Relacionados: [Calendario y contingencia](calendario-y-contingencia.md) · [Gobernanza Git](equipo-y-flujo-de-trabajo.md) · [Registro de IA](ia-register.md)

---

### 1. Asignación nominal

> **Completar al inicio del Sprint 1.** La trazabilidad individual es obligatoria: el [Registro de IA](ia-register.md) y los PR identifican a la persona responsable.

| Rol | Integrante | Usuario GitHub | Correo institucional |
|:---|:---|:---|:---|
| Rol 1 — Tech Lead y Scrum Master | *por completar* | | |
| Rol 2 — Backend Developer 1 | *por completar* | | |
| Rol 3 — Backend Developer 2 y DBA | *por completar* | | |
| Rol 4 — Frontend Developer 1 | *por completar* | | |
| Rol 5 — Frontend Developer 2 | *por completar* | | |
| Rol 6 — QA, DevOps y Seguridad | *por completar* | | |

---

### 2. Roles técnicos

#### 👤 Rol 1 — Tech Lead y Scrum Master
**Enfoque:** arquitectura general, gobernanza técnica y facilitación ágil.

| Responsabilidades | Entregables |
|:---|:---|
| Configurar y gobernar el repositorio (protección de ramas, *code owners*, Conventional Commits). | Repositorio configurado; tablero de GitHub Projects al día |
| Facilitar *planning*, *daily*, *review* y retrospectiva; gestionar impedimentos. | Actas breves de cada ceremonia |
| Diseñar e implementar el núcleo de seguridad: `SecurityFilterChain`, BCrypt 12, JWT, manejo global de errores. | Módulo `auth` y `common/security` |
| Mantener la arquitectura y los [ADRs](../02-diseno/decisiones-arquitectura.md); resolver bloqueos entre frontend y backend. | ADRs al día; revisiones de diseño |
| Coordinar la elección de cloud (ADR-007) y el CD junto con el Rol 6. | `cd-*.yml`, ambiente *staging* |
| Preparar los informes de fase y el release (`v0.5.0-mvp`, `v0.9.0-rc.1`, `v1.0.0`). | Informe de la Fase 1 (I + II) e informe final; notas de versión |

#### 👤 Rol 2 — Backend Developer 1 (dominio de solicitudes)
**Enfoque:** lógica de negocio central, máquina de estados y API de solicitudes (el **camino crítico del MVP**).

| Responsabilidades | Entregables |
|:---|:---|
| Entidades JPA de `Solicitud`, `HistorialSolicitud`, `EvidenciaArchivo`, `Comentario`. | Paquetes `solicitud`, `evidencia`, `comentario` |
| `SolicitudWorkflowService` (transiciones, [matriz](../02-diseno/arquitectura-tecnica.md#22-matriz-de-transiciones-y-permisos)), `AccessPolicy`, `CodigoSolicitudService`. | Workflow con ≥ 90 % de ramas cubiertas |
| Endpoints de alta, consulta, bandeja y todas las transiciones. | `SolicitudController` conforme a [API REST](../02-diseno/api-rest.md) |
| `FileStorageService` y validación de archivos por contenido. | Servicio de evidencias seguro |
| Documentar la API (OpenAPI) y la colección de pruebas de API (con el Rol 6). | `openapi.yaml`; colección Bruno |

#### 👤 Rol 3 — Backend Developer 2 y DBA
**Enfoque:** persistencia, datos maestros, administración y analítica.

| Responsabilidades | Entregables |
|:---|:---|
| Mantener el esquema ([migraciones Flyway](../../database/migrations/V1__esquema_inicial.sql)), índices y datos maestros; revisar todo cambio de BD. | `database/migrations/` al día |
| `DemoDataSeeder` y datos de volumen para pruebas de carga (~2 000 solicitudes). | Seed reproducible |
| CRUD de áreas, categorías, prioridades, estados y usuarios (baja lógica). | Paquetes `catalogo`, `usuario` |
| Consultas agregadas del dashboard (JPQL/SQL nativo parametrizado). | `DashboardRepository/Service` |
| Comentarios (apoyo). | Módulo `comentario` |

#### 👤 Rol 4 — Frontend Developer 1 (UI Lead y portal del solicitante)
**Enfoque:** arquitectura frontend, sistema de diseño y experiencia del solicitante.

| Responsabilidades | Entregables |
|:---|:---|
| Estructura React + Vite, React Router, rutas protegidas por rol. | `app/`, `ProtectedRoute`, `RoleRoute` |
| Sistema de diseño ([UX §2](../01-definicion/ux-ui-prototipo.md#2-sistema-de-diseño)), mockups y prototipo en Figma. | `tokens.css`, componentes `ui/`, enlace Figma |
| `apiClient` (`fetch`) con interceptores y `AuthContext`. | Cliente HTTP único |
| Pantallas: login, registro, nueva solicitud, mis solicitudes, detalle, perfil. | Feature `auth`, `solicitudes` |
| Pruebas de componentes con Vitest + Testing Library. | Pruebas de formularios y contexto |

#### 👤 Rol 5 — Frontend Developer 2 (UI operativa y dashboard)
**Enfoque:** herramientas de gestión, analítica visual y administración.

| Responsabilidades | Entregables |
|:---|:---|
| Maqueta HTML/CSS/JS de la Fase I con API simulada. | Maqueta navegable |
| Bandejas de supervisor y técnico, modales de asignación y resolución, línea de tiempo. | Feature `gestion` |
| Dashboard con Recharts (KPIs, categorías, prioridades, estados, responsables, vencidas). | Feature `dashboard` |
| Pantallas de administración (CRUD genérico con `useCrud`). | Feature `admin` |

#### 👤 Rol 6 — QA Engineer, DevOps y Seguridad
**Enfoque:** calidad, automatización, contenedores, seguridad y observabilidad.

| Responsabilidades | Entregables |
|:---|:---|
| Estrategia y automatización de pruebas ([Estrategia](../03-calidad-y-operacion/estrategia-pruebas.md)): JUnit/Mockito/Testcontainers, Vitest, Bruno, k6. | Suites en CI; informe de pruebas |
| Docker, Compose, Nginx, pipelines CI/CD ([DevOps](../03-calidad-y-operacion/devops-despliegue.md)). | Imágenes y *workflows* |
| Seguridad: hardening, SAST/DAST, secretos ([Seguridad](../03-calidad-y-operacion/seguridad-owasp.md)). | `security.yml`; informe de hallazgos |
| Observabilidad: logs, métricas, trazas, alertas, simulacro ([Observabilidad](../03-calidad-y-operacion/observabilidad.md)). | Dashboards y alertas |
| Auditar el uso de IA semanalmente. | Registro de IA verificado |

---

### 3. Distribución de carga y equilibrio

La carga por rol y las tareas están en [Equipo §3](#3-distribución-de-carga-y-equilibrio). Reglas para evitar cuellos de botella (riesgos R8 y R10):

| Riesgo detectado | Medida |
|:---|:---|
| **Rol 6 concentra QA + DevOps + Seguridad + Observabilidad** | El Rol 2 lidera la colección Bruno y el Rol 3 apoya alertas y OpenAPI; el Rol 1 co-lidera cloud/CD y hardening |
| **Rol 1 concentra seguridad, SM, CI y release** | La revisión de PR se reparte; el Rol 6 revisa los PR de infraestructura |
| **Rol 5 sin tarea de backend-dependiente hasta TASK-011** | Durante S1 construye la maqueta (TASK-033) y los componentes compartidos (tablas, modales) |
| **Rol 3 con poca carga entre 09/10 y 08/11** | Adelanta `DashboardRepository` con datos sembrados y pruebas de índices (apoya al Rol 2 en revisión) |
| **Conocimiento concentrado (bus factor)** | Cada módulo tiene un **responsable** y un **suplente** (tabla siguiente) |

#### Responsable y suplente por módulo

| Módulo | Responsable | Suplente |
|:---|:---:|:---:|
| Autenticación y seguridad | Rol 1 | Rol 6 |
| Solicitudes y workflow | Rol 2 | Rol 3 |
| Base de datos, catálogos y dashboard (BE) | Rol 3 | Rol 2 |
| Portal del solicitante y sistema de diseño (FE) | Rol 4 | Rol 5 |
| Bandeja, dashboard y administración (FE) | Rol 5 | Rol 4 |
| CI/CD, Docker, observabilidad, pruebas | Rol 6 | Rol 1 |

---

#### Observaciones de carga por rol (calendario vigente)

| Rol | Issues (total / F1 / F2) | Observación |
|:---|:-:|:---|
| **R1 Tech Lead / SM** | 29 / 14 / 15 | Informes, presentación 2 y Auth backend; delega revisión de PR |
| **R2 Backend 1** | 33 / 24 / 9 | Camino crítico del MVP (Registro y Gestión); en la Fase 2 sigue con comentarios y observabilidad de backend |
| **R3 Backend 2 / DBA** | 38 / 18 / 20 | Poca carga al inicio de la Fase 1 (09–12/10): adelantar `DashboardRepository` y pruebas de índices; asume parte del backend de Registro; Dashboard y Administración en la Fase 2 |
| **R4 Frontend 1** | 27 / 20 / 7 | Pico en la Fase 1 (diseño + login): R5 absorbe la maqueta; asume presentación y UAT |
| **R5 Frontend 2** | 30 / 18 / 12 | Maqueta y componentes comunes primero; luego bandejas, dashboard, administración y pruebas de frontend |
| **R6 QA / DevOps / Seguridad** | 34 / 18 / 16 | DevOps, CI/CD, seguridad y observabilidad de infraestructura; el rol más cargado en la Fase 2 aun tras el reparto |

Detalle por épica y equivalencia `TASK-xxx` → issues en el [backlog](../backlog/README.md#carga-por-rol). La carga real se revisa en cada *Sprint Planning*; si un rol excede su capacidad se mueve una tarea **antes** de comprometer el sprint.

### 4. Si el equipo no es de 6 integrantes

| Tamaño | Cómo se redistribuye |
|:---:|:---|
| **4** | R1+R6 → (SM, seguridad, CI) y (DevOps/QA) separados; R2+R3 → un Backend; R4+R5 → un Frontend, el cuarto es QA/DevOps. Se aplica el [plan de contingencia](calendario-y-contingencia.md#5-plan-de-contingencia-qué-se-recorta-y-en-qué-orden) desde el inicio. |
| **5** | Se fusionan R4 y R5 en un solo frontend con apoyo del Rol 1 en auth FE; el resto igual. |
| **7+** | Se añade un segundo QA (pruebas manuales/UAT/usabilidad) y se separa DevOps de Seguridad. |

Cualquier cambio se refleja en [§1](#1-asignación-nominal) y en el [Documento del proyecto](../01-definicion/documento-proyecto.md#53-supuestos).

---

### 5. Ceremonias ágiles

| Ceremonia | Frecuencia / duración | Participantes | Propósito y salida |
|:---|:---|:---|:---|
| **Refinamiento** | Semanal, 30 min | Todos | Dividir historias grandes (> 5 puntos), aclarar criterios BDD y marcarlas *Ready* ([DoR](../01-definicion/especificaciones-tecnicas.md#64-definición-de-ready-y-done)) |
| **Sprint Planning** | Inicio de sprint, 60 min | Todos | Objetivo del sprint, selección de issues, responsables y estimaciones; revisión de carga por rol |
| **Daily Standup** | Lun-Mié-Vie, **15 min estrictos** | Todos | ¿Qué logré? ¿Qué haré? ¿Qué me bloquea? Los bloqueos se anotan en el tablero (`bloqueado`) |
| **Sprint Review / Demo** | Fin de sprint, 45 min | Todos (+ docente en hitos) | Demostración **funcionando** de lo hecho; aceptación contra criterios BDD |
| **Retrospectiva** | Fin de sprint, 30 min | Todos | Qué mantener / qué mejorar / acciones con responsable (se registran como issues `mejora`) |
| **Revisión de IA** | Semanal, 15 min (dentro de la review) | Rol 6 + todos | Auditar el [Registro de IA](ia-register.md): entradas completas, validaciones reales |

---

### 6. Matriz RACI de entregables

R = Responsable · A = Aprobador final · C = Consultado · I = Informado

| Entregable | R1 | R2 | R3 | R4 | R5 | R6 |
|:---|:-:|:-:|:-:|:-:|:-:|:-:|
| Documento del proyecto / SRS | **A/R** | C | C | C | C | C |
| Arquitectura y ADRs | **A/R** | C | C | I | I | C |
| Modelo de datos y migraciones | A | C | **R** | I | I | C |
| Contratos de API / OpenAPI | A | **R** | **R** | C | C | C |
| UX/UI (Figma, maqueta) | A | I | I | **R** | **R** | C |
| Backend de solicitudes | A | **R** | C | I | I | C |
| Dashboard (BE / FE) | A | I | **R** / I | I | **R** | C |
| Administración (BE / FE) | A | I | **R** / I | C | **R** | C |
| Autenticación (BE / FE) | **R** / A | I | I | **R** | I | C |
| Docker, CI/CD, cloud | A/R | I | I | I | I | **R** |
| Seguridad / hardening | **R** | C | C | C | C | **R** |
| Pruebas y informe de pruebas | A | R | R | R | R | **R** |
| Observabilidad y alertas | A | I | C | I | I | **R** |
| Registro de IA | A | R | R | R | R | **R** (auditoría) |
| Manuales y sustentación | **A/R** | C | C | **R** | C | C |

---

### 7. Acuerdos de trabajo en equipo

1. **Revisión de código cruzada** (mínimo 1 aprobación, [Gobernanza](equipo-y-flujo-de-trabajo.md)): R2 ↔ R3 (backend); R4 ↔ R5 (frontend); R1 revisa seguridad y arquitectura; R6 revisa infraestructura y pruebas.
2. **Nadie fusiona su propio PR** ni hace *push* directo a `main`/`develop`.
3. **Programación en pareja** recomendada para las partes críticas (workflow, seguridad, CI): una persona escribe, otra revisa en vivo.
4. **Documentar mientras se construye:** si un PR cambia un contrato, esquema o regla, actualiza su documento fuente en el mismo PR ([ADR-010](../02-diseno/decisiones-arquitectura.md#adr-010--fuente-única-de-verdad-por-tema)).
5. **Comunicación:** un canal del equipo para el día a día; las decisiones técnicas quedan en un ADR o en el PR (no solo en el chat).
6. **Comprensión obligatoria:** cada integrante debe poder explicar el código que entrega, incluido el generado con IA.
7. **Ausencias:** se avisa en el *daily*; el suplente del módulo toma el trabajo bloqueante.
8. **Conflictos:** se resuelven en la retrospectiva; el Rol 1 decide en bloqueos técnicos, con registro en un ADR.

---

## Parte B — Guía de Gobernanza Git, Commits y Pull Requests

> **Estándar del equipo:** todo el código integrado al repositorio cumple estas reglas. Ningún commit o PR que las viole se aprueba.
> Relacionados: [Equipo y roles §7](#7-acuerdos-de-trabajo-en-equipo) · [DevOps §4](../03-calidad-y-operacion/devops-despliegue.md#4-pipeline-cicd-github-actions) · [Seguridad §6](../03-calidad-y-operacion/seguridad-owasp.md#6-gestión-de-secretos)

---

### 1. Estrategia de ramas (GitFlow adaptado)

```
[main]      ───────────────────────────────● v0.5.0-mvp ─────────● v0.9.0-rc.1 ───────● v1.0.0
                                           ▲                       ▲                     ▲
[release/*]                                └── release/v0.5.0-mvp  └── release/v0.9.0    └── release/v1.0.0
                                           ▲
[develop]   ──●────────●───────●───────●───┴───●───────●───────●───────●─────────────────
               \      / \     / \     /
[feature/*]     ●────●   ●───●   ●───●
```

#### 1.1 Ramas permanentes

| Rama | Rol | Protección (configurar en GitHub → Settings → Branches) |
|:---|:---|:---|
| **`main`** | Producción/hitos; siempre estable y desplegable | PR obligatorio · **1 aprobación mínima** · CI verde obligatorio (`backend`, `frontend`, `security`) · ramas al día · historial lineal no requerido · **sin *force push* ni borrado** · se aplica también a administradores · solo recibe `release/*` y `hotfix/*` |
| **`develop`** | Integración continua del equipo | PR obligatorio · 1 aprobación · CI verde · sin *force push* |

> **Estado actual:** el remoto solo tiene `main`. **Acción inmediata (TASK-001):** crear `develop` desde `main` y activar ambas protecciones.

#### 1.2 Ramas efímeras

| Patrón | Nace de → vuelve a | Uso | Ejemplos |
|:---|:---|:---|:---|
| `feature/<HU\|US>-<id>-<slug>` | `develop` → `develop` | Historia de usuario | `feature/HU-01-auth-jwt`, `feature/US-10-resolver-solicitud` |
| `fix/issue-<n>-<slug>` | `develop` → `develop` | Defecto detectado en pruebas | `fix/issue-14-cors-spring-security` |
| `docs/<slug>` | `develop` → `develop` | Solo documentación | `docs/actualizar-api-rest` |
| `release/<versión>` | `develop` → `main` (y de vuelta a `develop`) | Congelamiento y entrega de hitos | `release/v0.5.0-mvp`, `release/v1.0.0` |
| `hotfix/<slug>` | `main` → `main` **y** `develop` | Error crítico en producción | `hotfix/jwt-expiracion` |

Reglas: ramas de vida corta (idealmente < 3 días); un PR por historia/tarea; se elimina la rama remota al fusionar.

---

### 2. Convención de commits (Conventional Commits 1.0)

#### 2.1 Estructura

```text
<tipo>(<alcance opcional>): <descripción en imperativo y minúsculas>

[cuerpo opcional: qué y por qué, no el cómo]

[pie opcional: Closes #12 · BREAKING CHANGE: …]
```

#### 2.2 Tipos permitidos

| Tipo | Propósito | Ejemplo |
|:---|:---|:---|
| `feat` | Nueva funcionalidad | `feat(auth): implementar login con emision de jwt` |
| `fix` | Corrección de error | `fix(solicitud): corregir calculo de fecha limite de sla` |
| `docs` | Solo documentación | `docs(api): documentar endpoints de dashboard` |
| `refactor` | Cambio sin alterar comportamiento | `refactor(workflow): extraer tabla de transiciones` |
| `test` | Pruebas | `test(workflow): cubrir transicion invalida a resuelta` |
| `chore` | Mantenimiento/dependencias | `chore(deps): actualizar axios` |
| `ci` | Pipelines y Docker | `ci(actions): agregar job de codeql` |
| `perf` | Rendimiento | `perf(db): agregar indice compuesto estado-fecha` |
| `style` | Formato sin cambio de lógica | `style(frontend): aplicar prettier` |
| `build` | Build/empaquetado | `build(docker): fijar version de imagen base` |

**Alcances sugeridos:** `auth`, `solicitud`, `workflow`, `dashboard`, `admin`, `catalogo`, `db`, `api`, `ui`, `docker`, `actions`, `security`, `docs`.

#### 2.3 Buenas prácticas

1. **Atómicos y pequeños:** una unidad lógica por commit.
2. **Imperativo:** "agregar filtro", no "agregué" ni "agregando".
3. Primera línea ≤ **72 caracteres**, sin punto final.
4. **Un cambio incompatible** se marca con `!` o `BREAKING CHANGE:` y exige nota en el PR.
5. **Nunca** commitear secretos, `.env`, binarios grandes ni salidas de compilación (`target/`, `node_modules/`).
6. Referenciar el issue en el pie: `Closes #12`.

#### 2.4 Verificación automática (recomendada)

*Hook* `commit-msg` con `commitlint` y *pre-commit* con `gitleaks` para impedir mensajes inválidos y secretos antes de subir.

---

### 3. Protocolo de Pull Requests

#### 3.1 Ciclo de vida

1. **Actualizar la rama:** `git fetch && git merge origin/develop` (resolver conflictos localmente).
2. **Verificar localmente:** `mvn clean verify` (backend), `npm run lint && npm test && npm run build` (frontend), `gitleaks detect`.
3. **Abrir el PR** hacia `develop` (**nunca** directo a `main`) y completar la [plantilla](../../.github/pull_request_template.md): issue (`Closes #n`), módulo, tipo, cambios técnicos, pruebas, **capturas/evidencias**, uso de IA y *checklist*.
4. **Revisión por pares:** ≥ **1 aprobación** de otra persona (según [rotación](#7-acuerdos-de-trabajo-en-equipo)); el autor **no** aprueba ni fusiona su PR. Quien revisa usa la [lista de §3.2](#32-lista-de-revisión-de-código).
5. **CI verde** (`backend`, `frontend`, `security`).
6. **Estrategia de fusión:**
   - `feature/*`, `fix/*`, `docs/*` → `develop`: **Squash and Merge** (historial lineal; el título del *squash* sigue Conventional Commits).
   - `release/*` → `main`: **Merge commit** (conserva la trazabilidad de la versión) + *tag* SemVer; luego *merge back* a `develop`.
   - `hotfix/*` → `main` y `develop`.
7. **Eliminar** la rama remota tras fusionar.

#### 3.2 Lista de revisión de código

**Correctitud:** ¿cumple los criterios BDD del issue? ¿hay pruebas del caso feliz y de errores?
**Seguridad:** ¿valida entradas (`@Valid`, `@SinHtml`)? ¿hay autorización por rol **y** por recurso? ¿sin secretos/`hardcode`? ¿sin SQL concatenado? ¿sin `dangerouslySetInnerHTML`?
**Diseño:** ¿respeta capas (controller sin lógica, service transaccional)? ¿DTO en lugar de entidad? ¿errores con RFC 7807?
**Datos:** ¿cambios de esquema con migración nueva? ¿índices necesarios? ¿sin N+1?
**Calidad:** ¿nombres claros? ¿sin duplicación ni código muerto? ¿logs sin datos sensibles?
**Frontend:** ¿estados de carga/vacío/error? ¿accesible (etiquetas, foco)? ¿sin lógica de negocio duplicada?
**Documentación:** ¿actualizó su **fuente única** (API, esquema, spec, ADR)?
**IA:** si se usó IA, ¿está en el registro y el autor entiende el código?

---

### 4. Definición de Hecho (DoD)

Una tarea/historia está **hecha** solo si cumple **todo** lo siguiente:

- [ ] Cumple **todos** los criterios de aceptación BDD (verificados, con evidencia).
- [ ] Código revisado y **aprobado** por otra persona; PR fusionado en `develop`.
- [ ] **Pruebas** nuevas/actualizadas pasando (unitarias; integración/API si aplica); cobertura sin bajar de los umbrales.
- [ ] **CI verde** (build, pruebas, lint, seguridad).
- [ ] Sin secretos ni `hardcode`; entradas validadas; autorización probada.
- [ ] **Documentación actualizada** en su fuente única (API/OpenAPI, esquema/migración, spec, ADR, manual si afecta al usuario).
- [ ] Probada en el ambiente de integración (*staging* o Compose local) por alguien distinto del autor.
- [ ] Uso de IA registrado en [`ia-register.md`](ia-register.md) (si aplica).
- [ ] Issue cerrado y tablero actualizado.

---

### 5. Versionado y etiquetas de release

| Versión | Hito | Rama de origen |
|:---|:---|:---|
| `v0.5.0-mvp` | Presentación 1 (semana 8, 17/10) | `release/v0.5.0-mvp` |
| `v0.9.0-rc.N` | Release Candidate (control interno, 04/11) | `release/v0.9.0` |
| `v1.0.0` | Sustentación final (semana 12, 14/11) | `release/v1.0.0` |

SemVer: `MAYOR.MENOR.PARCHE`. Cada *tag* genera notas de versión a partir de los commits y adjunta `openapi.yaml`, cobertura e informes de seguridad ([DevOps §4.3](../03-calidad-y-operacion/devops-despliegue.md#43-versionado-y-releases)).

---

### 6. Archivos de gobernanza del repositorio

| Archivo | Propósito | Estado |
|:---|:---|:---:|
| [`.github/pull_request_template.md`](../../.github/pull_request_template.md) | Plantilla de PR | ✅ |
| [`.github/ISSUE_TEMPLATE/feature_story.md`](../../.github/ISSUE_TEMPLATE/feature_story.md) | Plantilla de historia de usuario | ✅ |
| `.github/ISSUE_TEMPLATE/bug_report.md` y `tarea_tecnica.md` | Plantillas para defectos y tareas técnicas | ⏳ (TASK-001) |
| `.github/CODEOWNERS` | Revisores automáticos por carpeta (`/backend/**` → R2/R3, `/frontend/**` → R4/R5, `/.github/**` y `/ops/**` → R6/R1, `/docs/**` → R1) | ⏳ (TASK-001) |
| `.github/dependabot.yml` | Actualización automática de dependencias | ⏳ (TASK-029) |
| `.gitignore` | Excluir `.env`, `target/`, `node_modules/`, volúmenes, IDE | ⏳ **urgente** (TASK-001) |
| `.env.example` | Plantilla de variables ([DevOps §5](../03-calidad-y-operacion/devops-despliegue.md#5-variables-de-entorno)) | ⏳ (TASK-001) |
| `.github/workflows/ci.yml` | CI inicial (con las [mejoras pendientes](../03-calidad-y-operacion/devops-despliegue.md#44-estado-actual-del-ci-diagnóstico-y-pendientes)) | ⚠️ esqueleto |

> Los archivos marcados ⏳ son configuración del repositorio y no forman parte de esta ronda de documentación; quedan listados como tarea de TASK-001/TASK-029.
