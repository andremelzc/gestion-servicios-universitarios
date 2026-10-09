# Sistema Web Inteligente para la Gestión Integral de Servicios Universitarios

Plataforma web full-stack para **registrar, priorizar, asignar, atender y monitorear** solicitudes de servicios universitarios (mantenimiento, soporte informático, incidencias de infraestructura, trámites), con trazabilidad completa, roles, indicadores de atención y una arquitectura segura, desplegable y observable.

> Proyecto del curso **Taller de Construcción de Software Web** · Ciclo 2026.
> **Estado:** Fase I (análisis, especificación y prototipo) en curso — documentación v2.0 redactada; construcción a partir del 12 de octubre.

---

## 🎯 ¿Qué problema resuelve?

Las solicitudes se pierden en correos y llamadas, nadie sabe quién es responsable ni cuánto se tarda, y no hay datos para decidir. El sistema ofrece:

| Problema | Solución |
|:---|:---|
| Pérdida/duplicación | Registro único con código `SOL-AAAA-NNNN` |
| Falta de seguimiento y trazabilidad | Máquina de 6 estados + historial **inmutable** |
| Responsable desconocido | Asignación explícita a un técnico del área |
| Sin tiempos ni calidad medida | SLA, MTTR y solicitudes vencidas |
| Sin indicadores | Dashboard por categoría, prioridad, responsable y estado |

## 👥 Roles del sistema

`ESTUDIANTE` (registra y sigue) · `TECNICO` (atiende) · `SUPERVISOR` (evalúa, prioriza, asigna) · `ADMIN` (usuarios y catálogos).

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|:---|:---|
| Frontend | React 18 + Vite · React Router · Recharts · Vitest + Testing Library |
| Backend | Spring Boot 3 · Java 17 · Spring Security 6 (JWT *stateless*) · Spring Data JPA · springdoc-openapi · Flyway |
| Base de datos | MySQL 8.0 (InnoDB) con constraints, triggers de inmutabilidad y migraciones versionadas |
| Gateway | Nginx (TLS, cabeceras de seguridad, *rate limiting*, proxy `/api`) |
| DevOps | Docker · Docker Compose · GitHub Actions (CI/CD) · GHCR |
| Calidad y seguridad | JUnit 5 · Mockito · Testcontainers · Bruno · k6 · CodeQL · OWASP ZAP · gitleaks · OWASP Top 10 |
| Observabilidad | Actuator · Micrometer · OpenTelemetry · Prometheus · Grafana · logs JSON con `traceId` |

---

## 📚 Documentación

**Índice completo y mapa de lectura:** [`docs/README.md`](docs/README.md)

| Para… | Documento |
|:---|:---|
| Entender el proyecto | [Documento del proyecto](docs/01-definicion/documento-proyecto.md) (problema, objetivos, alcance, riesgos) |
| Ver los requerimientos | [SRS](docs/01-definicion/especificaciones-tecnicas.md) (RF/RNF/RN, historias, trazabilidad) · [`specs/`](specs/README.md) (criterios BDD por módulo) |
| Entender el diseño | [Arquitectura](docs/02-diseno/arquitectura-tecnica.md) · [Modelo de datos](docs/02-diseno/modelo-datos.md) · [API REST](docs/02-diseno/api-rest.md) · [Decisiones (ADR)](docs/02-diseno/decisiones-arquitectura.md) · [UX/UI](docs/01-definicion/ux-ui-prototipo.md) |
| Asegurar, desplegar y operar | [Seguridad y OWASP](docs/03-calidad-y-operacion/seguridad-owasp.md) · [DevOps](docs/03-calidad-y-operacion/devops-despliegue.md) · [Observabilidad](docs/03-calidad-y-operacion/observabilidad.md) |
| Probar | [Estrategia de pruebas](docs/03-calidad-y-operacion/estrategia-pruebas.md) |
| Trabajar en equipo | [Calendario y contingencia](docs/04-gestion/calendario-y-contingencia.md) · [Equipo y flujo de trabajo](docs/04-gestion/equipo-y-flujo-de-trabajo.md) (roles, ramas, commits, PR) · [Backlog](docs/backlog/README.md) · [Registro de IA](docs/04-gestion/ia-register.md) |
| Entregar y sustentar | [Informes y sustentación](docs/05-entregables/informes-y-sustentacion.md) (incluye el índice del informe de la Fase I) |

### Base de datos
Esquema ejecutable y datos maestros en [`database/migrations/`](database/migrations) (`V1__esquema_inicial.sql`, `V2__datos_maestros.sql`).

---

## 🗓️ Calendario de hitos

El curso fijó **dos únicas presentaciones**: la de la **semana 8 (17/10/2026)** y la de la **semana 12 (14/11/2026)**. El proyecto se ejecuta de la **semana 7 a la 12** ([detalle](docs/04-gestion/calendario-y-contingencia.md#1-calendario-y-hitos)).

| Hito | Fecha | Entregable |
|:---|:---:|:---|
| **1 — Fase 1 (fases I + II)** | **17/10/2026** (semana 8) | Diseño y especificación (informe + prototipo) y **MVP funcional:** login → registrar → MySQL → consultar → cambiar estado |
| **2 — Fase 2 (fases III + IV)** | **14/11/2026** (semana 12) | Release `v1.0.0` desplegado: nube, CI/CD, API documentada, seguridad OWASP, pruebas, observabilidad, manuales y **sustentación con demostración integral** |

## 👥 Equipo

6 roles técnicos (Tech Lead/Scrum Master · Backend ×2 · Frontend ×2 · QA/DevOps/Seguridad). Asignación nominal y responsabilidades en [Equipo y roles](docs/04-gestion/equipo-y-flujo-de-trabajo.md).

## 🤖 Uso responsable de IA

Todo uso significativo de IA se registra en el archivo personal de cada rol dentro de [`docs/04-gestion/ia-registro/`](docs/04-gestion/ia-register.md#7-bitácora-de-entradas-reales) (reglas en [`ia-register.md`](docs/04-gestion/ia-register.md)) con prompt, resultado, validación y modificaciones. La IA es una herramienta de ingeniería, no un sustituto del aprendizaje.

## 🤝 Cómo contribuir

1. Lee [Gobernanza Git](docs/04-gestion/equipo-y-flujo-de-trabajo.md): ramas `feature/*` desde `develop`, **Conventional Commits**, PR con revisión y CI verde.
2. Toma una tarea del [Calendario y contingencia](docs/04-gestion/calendario-y-contingencia.md) y el `spec` de su módulo en [`specs/`](specs/README.md).
3. Cumple la [Definición de Hecho](docs/04-gestion/equipo-y-flujo-de-trabajo.md#4-definición-de-hecho-dod) y actualiza la **fuente única** de cualquier cosa que cambies.

> Nunca subas secretos ni archivos `.env`. Plantilla de variables: ver [DevOps §5](docs/03-calidad-y-operacion/devops-despliegue.md#5-variables-de-entorno).
