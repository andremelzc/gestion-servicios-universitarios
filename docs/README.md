# Centro de Documentación

## Sistema Web Inteligente para la Gestión Integral de Servicios Universitarios

Paquete completo de documentación de ingeniería del proyecto del curso **Taller de Construcción de Software Web**. Cubre el ciclo exigido: **Especificar → Diseñar → Construir → Integrar → Probar → Asegurar → Desplegar → Monitorear → Mejorar**.

> **Versión de la documentación: 2.0 (3 de octubre de 2026).** Cada tema vive en **un solo documento** ([ADR-010](02-diseno/decisiones-arquitectura.md#adr-010--fuente-única-de-verdad-por-tema)); los demás lo enlazan. Si encuentras una contradicción, la fuente única manda y se corrige el otro documento.

---

## 1. Por dónde empezar

| Si eres… | Lee primero |
|:---|:---|
| **Evaluador / docente** | [Informe de la Fase I](05-entregables/informes-y-sustentacion.md#7-informe-de-la-fase-i--análisis-especificación-y-prototipo) → [Documento del proyecto](01-definicion/documento-proyecto.md) → [SRS](01-definicion/especificaciones-tecnicas.md) → [Informes y sustentación](05-entregables/informes-y-sustentacion.md) |
| **Nuevo integrante del equipo** | [Documento del proyecto](01-definicion/documento-proyecto.md) → [Equipo y flujo de trabajo](04-gestion/equipo-y-flujo-de-trabajo.md) → [Calendario](04-gestion/calendario-y-contingencia.md) → el [`spec`](../specs/README.md) de tu módulo → tus issues en el [backlog](backlog/README.md) |
| **Desarrollador backend** | [Arquitectura](02-diseno/arquitectura-tecnica.md) → [Modelo de datos](02-diseno/modelo-datos.md) → [API REST](02-diseno/api-rest.md) → [Seguridad](03-calidad-y-operacion/seguridad-owasp.md) |
| **Desarrollador frontend** | [UX/UI](01-definicion/ux-ui-prototipo.md) → [API REST](02-diseno/api-rest.md) → [Arquitectura §4.2](02-diseno/arquitectura-tecnica.md#42-frontend-por-features) |
| **QA / DevOps** | [Estrategia de pruebas](03-calidad-y-operacion/estrategia-pruebas.md) → [DevOps](03-calidad-y-operacion/devops-despliegue.md) → [Observabilidad](03-calidad-y-operacion/observabilidad.md) → [Seguridad](03-calidad-y-operacion/seguridad-owasp.md) |

---

## 2. Estructura de `docs/`

Las carpetas siguen el ciclo del enunciado (*Especificar → Diseñar → Asegurar, Probar, Desplegar y Monitorear → Gestionar y Entregar*). Los criterios de aceptación de cada módulo están en [`specs/`](../specs/README.md) y las tareas en [`backlog/`](backlog/README.md).

```
docs/
├── README.md                      ← este índice
├── 01-definicion/                 Qué se construye y para quién
├── 02-diseno/                     Cómo se construye
├── 03-calidad-y-operacion/        Cómo se asegura, prueba, despliega y monitorea
├── 04-gestion/                    Cómo se organiza el equipo y el calendario
├── 05-entregables/                Qué se entrega y cómo se sustenta
└── backlog/                       Issues de GitHub, milestones y cobertura del enunciado
```

### 2.1 `01-definicion/` — Definición y especificación (Fase I)

| Documento | Contenido | Fuente única de… |
|:---|:---|:---|
| **[Documento del proyecto](01-definicion/documento-proyecto.md)** | Problema, justificación, objetivos (OE-1…10), actores, alcance, supuestos, riesgos, criterios de éxito, glosario | Contexto, objetivos y riesgos |
| **[Especificaciones (SRS)](01-definicion/especificaciones-tecnicas.md)** | RF-01…13, RN (19 vigentes), RNF-01…13, épicas, 10 HU → 29 US, historias técnicas, alcance MVP, **matriz de trazabilidad** | Requerimientos e historias |
| **[UX/UI y prototipo](01-definicion/ux-ui-prototipo.md)** | Personas, sistema de diseño, 10 wireframes, flujos, plan de prototipo/maqueta, usabilidad (SUS), accesibilidad, microcopy | Diseño de interfaz |

### 2.2 `02-diseno/` — Diseño técnico

| Documento | Contenido | Fuente única de… |
|:---|:---|:---|
| **[Arquitectura técnica](02-diseno/arquitectura-tecnica.md)** | Capas, **máquina de estados y matriz de permisos**, estructura de código, archivos, flujos de secuencia, patrones, errores RFC 7807, ambientes | Arquitectura y workflow |
| **[Modelo de datos](02-diseno/modelo-datos.md)** | ERD, diccionario de las 11 tablas, índices, consultas del dashboard | Descripción del esquema |
| **[`database/migrations/`](../database/migrations/V1__esquema_inicial.sql)** | `V1` esquema (constraints, triggers) y `V2` datos maestros | **DDL ejecutable** |
| **[API REST](02-diseno/api-rest.md)** | 57 endpoints, JSON, códigos HTTP, **matriz de autorización**, OpenAPI, GraphQL/gRPC/webhooks y API Gateway | Contratos de API |
| **[Decisiones de arquitectura (ADR)](02-diseno/decisiones-arquitectura.md)** | 14 ADRs y, al final, el **registro de 24 contradicciones resueltas** | Decisiones técnicas |

### 2.3 `03-calidad-y-operacion/` — Calidad, seguridad y operación (Fases III–IV)

| Documento | Contenido | Fuente única de… |
|:---|:---|:---|
| **[Seguridad y OWASP](03-calidad-y-operacion/seguridad-owasp.md)** | Amenazas, **matriz OWASP Top 10**, subida de archivos, autenticación, secretos, cabeceras, SAST/DAST, checklist de hardening | Seguridad |
| **[DevOps y despliegue](03-calidad-y-operacion/devops-despliegue.md)** | Contenedores, ambientes, **pipeline CI/CD**, variables de entorno, Nginx, diagnóstico del CI actual, operación del host | Infraestructura y despliegue |
| **[Observabilidad](03-calidad-y-operacion/observabilidad.md)** | Logs JSON con `traceId`, métricas, trazas OTel, **alertas**, gestión de incidentes, runbooks | Monitoreo |
| **[Estrategia de pruebas](03-calidad-y-operacion/estrategia-pruebas.md)** | Niveles, BDD, UAT, API, **carga y estrés (k6)**, seguridad, pruebas con IA, informe, 34 casos prioritarios | Pruebas y calidad |

### 2.4 `04-gestion/` — Gestión del proyecto

| Documento | Contenido | Fuente única de… |
|:---|:---|:---|
| **[Calendario y contingencia](04-gestion/calendario-y-contingencia.md)** | Calendario (semanas 7–12, presentaciones 17/10 y 14/11), hitos, sprints, ruta crítica, plan de contingencia, cumplimiento del ciclo | Calendario |
| **[Equipo y flujo de trabajo](04-gestion/equipo-y-flujo-de-trabajo.md)** | **Parte A:** 6 roles, asignación, carga, suplentes, RACI, ceremonias. **Parte B:** ramas, Conventional Commits, PR, **Definición de Hecho**, versionado | Organización del equipo y flujo Git |
| **[Registro de uso de IA](04-gestion/ia-register.md)** | Reglas, campos exigidos, auditoría, bitácora real y ejemplos | Uso de IA |

### 2.5 `05-entregables/` — Entrega y sustentación

| Documento | Contenido | Fuente única de… |
|:---|:---|:---|
| **[Informes y sustentación](05-entregables/informes-y-sustentacion.md)** | Mapa de entregables, plantilla del informe de la Fase 1, informe final y manuales, **checklist de release**, guion de la demo, preguntas de sustentación e [índice del informe de la Fase I](05-entregables/informes-y-sustentacion.md#7-informe-de-la-fase-i--análisis-especificación-y-prototipo) | Entregables |

### 2.6 `backlog/` — Tareas

| Documento | Contenido |
|:---|:---|
| **[Backlog de Issues](backlog/README.md)** | **193 issues** atómicos (1 issue = 1 responsable) con dependencias, mapa de cobertura del enunciado, equivalencia con las `TASK-xxx` y gestión en GitHub Projects |
| **[Milestones](backlog/milestones.md)** | 14 sub-milestones en 2 fases (presentaciones 17/10 y 14/11) |

---

## 3. Plantillas y automatización

| Recurso | Ubicación |
|:---|:---|
| Plantilla de historia de usuario (issue) | [`.github/ISSUE_TEMPLATE/feature_story.md`](../.github/ISSUE_TEMPLATE/feature_story.md) |
| Plantilla de Pull Request | [`.github/pull_request_template.md`](../.github/pull_request_template.md) |
| CI inicial (esqueleto; mejoras pendientes en [DevOps §4.4](03-calidad-y-operacion/devops-despliegue.md#44-estado-actual-del-ci-diagnóstico-y-pendientes)) | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |

---

## 4. Convenciones de la documentación

| Convención | Detalle |
|:---|:---|
| **Idioma** | Español; identificadores técnicos (clases, endpoints, columnas) tal como están en el código |
| **Identificadores** | `RF`, `RNF`, `RN`, `HU`, `US`, `TS`, `CA-n` (por spec), `TASK-xxx`, `TC-xxx` (casos de prueba), `UAT-xx`, `ADR-xxx`, `W-xx` (wireframes) |
| **Prioridad** | MoSCoW: **M**ust / **S**hould / **C**ould |
| **Diagramas** | Mermaid (se renderiza en GitHub) y ASCII para wireframes |
| **Enlaces** | Relativos, con ancla a la sección concreta; no se copia contenido entre documentos |
| **Cambios** | Un PR que cambia una regla/contrato/esquema actualiza **su fuente única** en el mismo PR ([Gobernanza §4](04-gestion/equipo-y-flujo-de-trabajo.md#4-definición-de-hecho-dod)) |
| **Estado de artefactos** | ✅ listo · ⏳ pendiente · ⚠️ parcial |

---

## 5. Estado de la documentación y lo que falta

| Elemento | Estado | Responsable |
|:---|:---:|:---:|
| Documentos de este índice | ✅ Redactados (v2.0), **pendientes de revisión humana del equipo** | Rol 1 |
| Esquema SQL `V1`/`V2` | ⚠️ Escrito; **no probado contra MySQL 8.0 real** (TASK-002) | Rol 3 |
| Mockups de alta fidelidad y prototipo (Figma) | ⏳ TASK-003 (09/10) | Rol 4 |
| Maqueta HTML/CSS/JS | ⏳ TASK-033 (11/10) | Rol 5 |
| Elección de plataforma cloud (ADR-007) | ⏳ Propuesta; confirmar antes del 23/10 | Roles 1 y 6 |
| Asignación nominal de roles | ⏳ [Equipo §1](04-gestion/equipo-y-flujo-de-trabajo.md#1-asignación-nominal) | Rol 1 |
| Calendario de semanas (supuesto) | ⏳ Confirmar con el docente ([Calendario §1.1](04-gestion/calendario-y-contingencia.md#11-calendario-vigente)) | Rol 1 |
| Manuales, informe de pruebas, informe final | ⏳ Fase IV | Roles 1, 4 y 6 |
| Archivos de repositorio (`.gitignore`, `.env.example`, `CODEOWNERS`, `dependabot.yml`, workflows de seguridad y CD) | ⏳ [Gobernanza §6](04-gestion/equipo-y-flujo-de-trabajo.md#6-archivos-de-gobernanza-del-repositorio) | Roles 1 y 6 |
