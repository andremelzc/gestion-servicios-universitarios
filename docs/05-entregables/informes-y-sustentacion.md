# Informes, Entregables y Sustentación

> **Objetivo (TS-12, OE-10):** definir qué se entrega en cada hito, cómo se redactan los manuales y el informe, qué se revisa antes del release y cómo se prepara una **demostración integral** (no una presentación de diapositivas).
> Relacionados: [Calendario y contingencia](../04-gestion/calendario-y-contingencia.md) · [Estrategia de pruebas §13](../03-calidad-y-operacion/estrategia-pruebas.md#13-informe-de-pruebas-entregable) · [Registro de IA](../04-gestion/ia-register.md) · [Informe de la Fase I (§7)](#7-informe-de-la-fase-i--análisis-especificación-y-prototipo)

---

## 1. Mapa de entregables por hito

| Hito | Fecha | Entregable en Classroom | Contenido mínimo | Responsable |
|:---|:---:|:---|:---|:---:|
| **Fase 1 (I + II) — semana 8** | **17/10/2026** | **Informe de la Fase 1 (§2)** + presentación con demostración + tag `v0.5.0-mvp` | Los 12 puntos de la presentación ([índice](#7-informe-de-la-fase-i--análisis-especificación-y-prototipo)): problema, justificación, usuarios, alcance, requerimientos, épicas, HU, criterios, arquitectura, wireframes/mockups, prototipo y evidencia del primer desarrollo; **MVP funcional end-to-end**, evidencias y estado de calidad | Rol 1 |
| **Fase 2 (III + IV) — semana 12** | **14/11/2026** | **Informe final (§3)** + exposición con demostración + `v1.0.0` | App desplegada, API documentada, CI/CD, autenticación/autorización, seguridad, pruebas, observabilidad, manuales, informe de pruebas, repositorio, evidencias, presentación y demo (el Release Candidate `v0.9.0-rc.1` se etiqueta el 04/11 como control interno) | Equipo |

---

## 2. Plantilla del informe de la Fase 1

Se presenta en la **semana 8 (17/10/2026)** y cubre las fases I + II: incluye como primera parte el [informe de Fase I](#7-informe-de-la-fase-i--análisis-especificación-y-prototipo) y como segunda el avance del MVP. Documento breve (8–12 páginas) con esta estructura:

1. **Resumen** y objetivo del hito; estado general (semáforo).
2. **Alcance entregado vs. planificado** (tabla de US del [MVP](../01-definicion/especificaciones-tecnicas.md#7-alcance-del-mvp-17102026): hecho / parcial / diferido y por qué).
3. **Demostración del flujo end-to-end:** *login → registrar solicitud → guardar en MySQL → consultar → modificar estado*, con **capturas** de cada paso y del registro en la BD y del historial.
4. **Arquitectura implementada:** capas reales, tecnologías, diagrama actualizado; diferencias respecto al diseño y por qué.
5. **Construcción:** React (componentes, props, estado, eventos, listas, render condicional), Spring Boot (controladores, servicios, DTO, validaciones, capas, MySQL), CRUD y verbos HTTP, `fetch`, cookies y `localStorage`/`sessionStorage`.
6. **Calidad:** pruebas unitarias ejecutadas (resultados y cobertura); defectos abiertos.
7. **Gestión:** *burndown*, retrospectiva S1, riesgos materializados.
8. **Uso de IA:** resumen del [Registro de IA](../04-gestion/ia-register.md) y 2 casos destacados.
9. **Plan de la Fase 2** (fases III + IV) y riesgos.
10. **Anexos:** enlace al repositorio y *tag*, colección de API.

---

## 3. Informe final y manuales (semana 12)

### 3.1 Informe final

1. Carátula y resumen ejecutivo.
2. Problema, objetivos y alcance (versión final y qué se cambió respecto a Fase I, con justificación).
3. Especificación: épicas, HU y trazabilidad.
4. Diseño: arquitectura, datos, API, UX/UI y ADRs principales.
5. Construcción: decisiones relevantes y patrones aplicados.
6. Pruebas: resumen y enlace al **informe de pruebas**.
7. Seguridad: matriz OWASP, SAST/DAST, gestión de secretos.
8. Despliegue y CI/CD: ambientes, *pipeline*, enlace a la aplicación.
9. Observabilidad: dashboards, alertas, simulacro de incidente.
10. Uso de IA: casos, validación y aprendizajes ([IA §10](../04-gestion/ia-register.md#10-reflexión-final-se-completa-en-la-fase-iv)).
11. Gestión del equipo: sprints, retrospectivas, contribución por integrante (commits/PR).
12. Resultados frente a los objetivos OE-1…OE-10 ([Documento del proyecto §3.2](../01-definicion/documento-proyecto.md#32-objetivos-específicos-y-cómo-se-verifican)).
13. Limitaciones y trabajo futuro (p. ej. HttpOnly + CSRF, ClamAV, SSE, webhooks).
14. **Lecciones aprendidas** (proyecto y uso de IA), conclusiones y anexos.

### 3.2 Manual de usuario (`docs/MANUAL_USUARIO.pdf`)

Público: estudiantes, técnicos, supervisores y administradores. Con **capturas reales** del sistema desplegado.

| Capítulo | Contenido |
|:---|:---|
| 1. Introducción | Qué es el sistema, requisitos (navegador), cómo acceder |
| 2. Primeros pasos | Registro, inicio de sesión, cambiar contraseña, cerrar sesión, qué significa cada estado (con colores) |
| 3. Guía del solicitante | Registrar una solicitud (campos, evidencias), seguir el estado, línea de tiempo, comentar, cerrar |
| 4. Guía del técnico | Bandeja de asignadas, iniciar atención, resolver con informe y evidencia |
| 5. Guía del supervisor | Bandeja del área, evaluar, priorizar, asignar/reasignar, dashboard y cómo interpretar KPIs (SLA, MTTR, vencidas) |
| 6. Guía del administrador | Usuarios y roles, áreas, categorías, prioridades, estados |
| 7. Perfil | Cambio de contraseña |
| 8. Preguntas frecuentes y solución de problemas | Mensajes de error y qué hacer; código de soporte (`traceId`) |
| 9. Glosario | Términos del sistema |

### 3.3 Manual técnico (`docs/MANUAL_TECNICO.md`)

Público: quien mantenga o despliegue el sistema. **Consolida** (con enlaces a los documentos fuente, sin duplicarlos):

| Capítulo | Contenido / fuente |
|:---|:---|
| 1. Visión y arquitectura | [Arquitectura](../02-diseno/arquitectura-tecnica.md), diagramas, stack, ADRs |
| 2. Modelo de datos | [Modelo de datos](../02-diseno/modelo-datos.md), ERD, migraciones |
| 3. API | [API REST](../02-diseno/api-rest.md), `openapi.yaml`, ejemplos |
| 4. Seguridad | [Seguridad y OWASP](../03-calidad-y-operacion/seguridad-owasp.md) |
| 5. Instalación y ejecución local | Prerrequisitos, `.env`, `docker compose up`, usuarios demo, cómo correr pruebas |
| 6. Configuración | [Variables de entorno](../03-calidad-y-operacion/devops-despliegue.md#5-variables-de-entorno) |
| 7. Despliegue | [DevOps](../03-calidad-y-operacion/devops-despliegue.md): ambientes y CI/CD |
| 8. Observabilidad y operación | [Observabilidad](../03-calidad-y-operacion/observabilidad.md): dashboards, alertas, runbooks |
| 9. Pruebas | [Estrategia](../03-calidad-y-operacion/estrategia-pruebas.md) e informe |
| 10. Guía del desarrollador | Estructura del código, [Gobernanza Git](../04-gestion/equipo-y-flujo-de-trabajo.md), convenciones, cómo añadir una transición/endpoint/migración |
| 11. Problemas conocidos y evolución | Riesgos aceptados, mejoras futuras |

---

## 4. Checklist de release y revisión final

Se completa en TASK-023 (congelamiento) y se adjunta al informe final. El enunciado pide: revisión de arquitectura, código, patrones de diseño, eliminación de *hardcode*, gestión de secretos, manejo de errores, documentación, escenarios y uso de IA.

### 4.1 Revisión de arquitectura y patrones
- [ ] El código respeta las capas ([Arquitectura §3.1](../02-diseno/arquitectura-tecnica.md#31-responsabilidades-por-capa)); sin lógica de negocio en controladores ni acceso a repositorios desde ellos.
- [ ] Patrones declarados en [§7 de arquitectura](../02-diseno/arquitectura-tecnica.md#7-patrones-de-diseño-aplicados) realmente presentes (State/Strategy en workflow, DTO, Specification, `AccessPolicy`).
- [ ] Diagramas y ADRs coinciden con lo implementado (se actualizan si cambió).

### 4.2 Revisión de código y calidad
- [ ] Sin código muerto, `TODO` sin issue, `System.out`/`console.log` de depuración.
- [ ] Sin consultas N+1 (verificado en logs de Hibernate o trazas); paginación en todos los listados.
- [ ] Cobertura ≥ umbrales ([Pruebas §11](../03-calidad-y-operacion/estrategia-pruebas.md#11-cobertura-y-quality-gates)); 0 pruebas deshabilitadas sin justificar.
- [ ] Linter y formateador limpios (backend y frontend).

### 4.3 Eliminación de *hardcode* y secretos
- [ ] Búsqueda de `password`, `secret`, `token`, `jdbc:`, URLs de servidor y puertos en el árbol **y en el historial**.
- [ ] `gitleaks` limpio; `.env` no versionado; `.env.example` completo.
- [ ] Constantes de negocio (SLA, límites, dominio) provienen de BD o configuración, no de literales dispersos.
- [ ] Contraseñas por defecto cambiadas ([hardening](../03-calidad-y-operacion/seguridad-owasp.md#103-checklist-de-hardening-previo-al-release)).

### 4.4 Manejo de errores
- [ ] Toda respuesta de error es RFC 7807 con `traceId`; no hay *stacktraces* al cliente.
- [ ] El frontend muestra mensajes de [UX §9](../01-definicion/ux-ui-prototipo.md#9-microcopy-mensajes-de-la-interfaz) y el código de soporte en errores 5xx.
- [ ] Casos de red caída, 401 (sesión expirada) y 403/404 cubiertos.

### 4.5 Escenarios y requisitos
- [ ] Todos los escenarios BDD *Must* ejecutados (automático o UAT) y trazados a su prueba.
- [ ] Matriz de [trazabilidad](../01-definicion/especificaciones-tecnicas.md#9-matriz-de-trazabilidad) sin huecos.
- [ ] Revisión de escenarios con IA registrada (si se hizo).

### 4.6 Revisión del uso de IA
- [ ] Registro de IA completo, con validaciones reales y reflexión final.
- [ ] Cada integrante puede explicar su código (simulacro de preguntas cruzadas).

### 4.7 Ciclo completo *(criterio de calificación del enunciado)*

| Especificar | Diseñar | Construir | Integrar | Probar | Asegurar | Desplegar | Monitorear | Mejorar |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

Cada casilla se marca con **enlace a su evidencia** (ver [Calendario §6](../04-gestion/calendario-y-contingencia.md#6-cumplimiento-del-ciclo-exigido)).

### 4.8 Paquete de release
- [ ] Tag `v1.0.0` en `main`; notas de versión; `openapi.yaml`; informes de cobertura, SAST/DAST y k6 adjuntos.
- [ ] README con enlace a la app desplegada y a la documentación.
- [ ] Repositorio ordenado: sin archivos temporales; licencia/uso académico indicado.

---

## 5. Guion de la sustentación (demostración integral)

> El enunciado exige una **demostración integral del sistema, no solo diapositivas**, y propone una secuencia de 14 pasos que este guion sigue. Duración a confirmar con el docente; el guion está pensado para ~**25 minutos** + preguntas, y se ensaya con cronómetro (TASK-038).

### 5.1 Secuencia y tiempos

| # | Min | Bloque | Qué se muestra (en vivo) | Expone |
|:-:|:-:|:---|:---|:---:|
| 1 | 1 | **Problema** | Los 7 problemas P1–P7 que resuelve el sistema (1 diapositiva) | R1 |
| 2 | 1 | **Solución propuesta** | Qué se construyó: el sistema, sus 5 módulos y los 4 roles | R1 |
| 3 | 1 | **Arquitectura** | React → API REST Spring Boot → MySQL; CI/CD, Docker, nube y observabilidad (1 diapositiva) | R1 |
| 4 | 1 | **Historias de usuario** | Épicas, historias y dos escenarios BDD con su prueba | R4 |
| 5 | 6 | **Demo Frontend** | Estudiante **se registra / inicia sesión** → **crea solicitud** con foto → ve código y estado → Supervisor **evalúa y asigna** → Técnico **inicia y resuelve** con informe y evidencia → Estudiante **cierra**; dashboard (supervisor vs admin) y administración (crear categoría y desactivarla) | R4, R5, R3 |
| 6 | 2 | **Demo Backend/API** | Swagger/OpenAPI (en *staging*): autenticarse con JWT y ejecutar un endpoint; códigos HTTP y error RFC 7807 | R2 |
| 7 | 1 | **Base de datos** | Esquema, la fila de la solicitud recién creada y su historial inmutable | R3 |
| 8 | 3 | **Seguridad** | Intento de acceder a una solicitud ajena (404); `<script>` en la descripción (400); archivo `.exe` rechazado; reporte CodeQL y `gitleaks` limpios; ZAP *baseline* | R6, R1 |
| 9 | 2 | **Testing** | Resultados: cobertura, pruebas de API, k6 (P95 vs RNF-02), SUS | R6 |
| 10 | 2 | **CI/CD** | `docker compose up` (o *pipeline* verde); un PR con CI; despliegue automático; tag y release | R6 |
| 11 | 1 | **Cloud** | URL pública, TLS y ambientes (dev, prueba, producción) | R6 |
| 12 | 2 | **Observabilidad** | Dashboard de Grafana; provocar un error y seguirlo por `traceId` hasta el log y la traza en Jaeger; alerta disparada (simulacro) | R6 |
| 13 | 1 | **Resultados** | Resultados frente a los objetivos OE-1…OE-10 | R1 |
| 14 | 1 | **Lecciones aprendidas** | Proceso, sprints, uso de IA (2 casos con prueba que detectó un error de la IA) y qué se mejoraría | R1, R2 |
| — | 5+ | **Preguntas** | Cualquier integrante puede responder sobre cualquier parte | Todos |

### 5.2 Reglas de la demo

1. **Todo en vivo y sobre el sistema desplegado** (URL pública).
2. **Datos sembrados** y cuentas de los 4 roles ya probadas; ventanas/perfiles de navegador separados por rol para no perder tiempo en logins.
3. **Reparto equitativo:** cada integrante interviene al menos una vez.
4. **Ensayo general** (TASK-038) con cronómetro y con alguien ajeno al equipo haciendo preguntas.
5. Nada de depender de "se hace en otra pantalla": mostrar el resultado en la BD/log cuando importe (p. ej. la fila del historial).

### 5.3 Preparación del ambiente de demo (checklist)

- [ ] Ambiente `prod`/demo desplegado desde el *tag* `v1.0.0` (no desde una rama).
- [ ] BD reiniciada con **seed reproducible**: usuarios de los 4 roles, catálogos y ~30 solicitudes en estados variados (algunas vencidas, con historial).
- [ ] Contraseñas de demo fuertes, fuera del repo; guardadas en un gestor del equipo.
- [ ] Ambiente de demo recreado desde cero con el *seed* reproducible antes de la demo.
- [ ] Certificado TLS vigente; dominio resuelve; `/actuator/health` en `UP`.
- [ ] Grafana con datos recientes; una alerta de simulacro lista para disparar.
- [ ] Un *script* de reinicio de datos de demo por si hay que repetir el flujo.

---

## 6. Preguntas que el equipo debe saber responder

| Tema | Pregunta esperable | Dónde está la respuesta |
|:---|:---|:---|
| Arquitectura | ¿Por qué monolito y no microservicios? | [ADR-002](../02-diseno/decisiones-arquitectura.md#adr-002--monolito-modular-con-frontend-desacoplado) |
| Máquina de estados | ¿Por qué se puede asignar desde `REGISTRADA` y cómo se audita? | [ADR-003](../02-diseno/decisiones-arquitectura.md#adr-003--atajo-de-asignación-desde-registrada) |
| Seguridad | ¿Por qué `localStorage` para el JWT si hay riesgo de XSS? ¿Cómo se mitiga? | [ADR-004](../02-diseno/decisiones-arquitectura.md#adr-004--jwt-de-8-horas-sin-refresh-token) |
| Seguridad | ¿Cómo evitan que un estudiante vea tickets ajenos? | [Seguridad A01](../03-calidad-y-operacion/seguridad-owasp.md#3-matriz-owasp-top-10-2021), RN-16 |
| Seguridad | ¿Por qué BCrypt con coste 12 si el login tarda más? | [Pruebas §8.3](../03-calidad-y-operacion/estrategia-pruebas.md#83-umbrales-k6) |
| Datos | ¿Por qué baja lógica? ¿Cómo garantizan que el historial no se altere? | [ADR-014](../02-diseno/decisiones-arquitectura.md#adr-014--baja-lógica-generalizada-e-historial-inmutable) |
| Datos | ¿Cómo evitan códigos duplicados bajo concurrencia? | [ADR-011](../02-diseno/decisiones-arquitectura.md#adr-011--código-de-solicitud-correlativo-generado-en-base-de-datos) |
| API | ¿Por qué REST y no GraphQL/gRPC? ¿Qué es el API Gateway aquí? | [API §8](../02-diseno/api-rest.md#8-panorama-de-estilos-de-api-y-api-gateway) |
| DevOps | ¿Cómo se despliega y cómo se revierte un cambio? | [DevOps §4](../03-calidad-y-operacion/devops-despliegue.md#4-pipeline-cicd-github-actions) |
| Calidad | ¿Cómo saben que las pruebas generadas por IA sirven? | [Pruebas §10](../03-calidad-y-operacion/estrategia-pruebas.md#10-pruebas-con-apoyo-de-ia) |
| Observabilidad | Un usuario reporta un error: ¿cómo lo diagnostican? | [Observabilidad §9](../03-calidad-y-operacion/observabilidad.md#9-depuración-con-observabilidad-guion) |
| Proceso | ¿Qué recortaron y por qué? ¿Qué mejorarían? | [Calendario §5](../04-gestion/calendario-y-contingencia.md#5-plan-de-contingencia-qué-se-recorta-y-en-qué-orden), retrospectivas |

---

## 7. Informe de la Fase I — Análisis, especificación y prototipo

> **Primera parte del informe de la Fase 1 (presentación del 17 de octubre de 2026).** Debe estar completo el 13/10. Este documento es el **índice del informe** que se presenta en la Fase I. Cada punto exigido por el enunciado se resuelve con un enlace a su documento fuente (no se duplica contenido, [ADR-010](../02-diseno/decisiones-arquitectura.md#adr-010--fuente-única-de-verdad-por-tema)) y se indica su estado real.
> Producto esperado de la fase: **diseño y especificación**.

---

### 7.1 Los 12 puntos de la presentación

| # | Punto exigido | Dónde está | Estado |
|:-:|:---|:---|:---:|
| 1 | **Problema** | [Documento del proyecto §2](../01-definicion/documento-proyecto.md#2-planteamiento-del-problema) | ✅ |
| 2 | **Justificación** | [Documento del proyecto §2.3](../01-definicion/documento-proyecto.md#23-justificación) | ✅ |
| 3 | **Usuarios** | [Documento del proyecto §4](../01-definicion/documento-proyecto.md#4-actores-y-usuarios) · [UX §1 (personas)](../01-definicion/ux-ui-prototipo.md#1-usuarios-y-necesidades) | ✅ |
| 4 | **Alcance** | [Documento del proyecto §5](../01-definicion/documento-proyecto.md#5-alcance) | ✅ |
| 5 | **Requerimientos** | [SRS §3–§5](../01-definicion/especificaciones-tecnicas.md#3-requerimientos-funcionales-rf) (RF, RN, RNF) | ✅ |
| 6 | **Épicas** | [SRS §6.1](../01-definicion/especificaciones-tecnicas.md#61-épicas) | ✅ |
| 7 | **Historias de usuario** | [SRS §6.2](../01-definicion/especificaciones-tecnicas.md#62-historias-de-usuario-y-su-división) (10 HU divididas en 29 US + 12 historias técnicas) | ✅ |
| 8 | **Criterios de aceptación** | `specs/*/01-spec.md` (escenarios BDD en Gherkin) — [índice](../../specs/README.md) | ✅ |
| 9 | **Arquitectura preliminar** | [Arquitectura técnica](../02-diseno/arquitectura-tecnica.md) · [Modelo de datos](../02-diseno/modelo-datos.md) · [ADRs](../02-diseno/decisiones-arquitectura.md) | ✅ |
| 10 | **Wireframes / mockups** | Wireframes: [UX §5](../01-definicion/ux-ui-prototipo.md#5-wireframes-de-baja-fidelidad). Mockups de alta fidelidad: Figma (TASK-003, 09/10) | ⚠️ wireframes ✅ · mockups ⏳ |
| 11 | **Prototipo** | Prototipo clicable en Figma (TASK-003) y maqueta HTML/CSS/JS ([UX §6](../01-definicion/ux-ui-prototipo.md#6-prototipo-y-desarrollo-de-la-fase-i), TASK-033) | ⏳ |
| 12 | **Evidencia del primer desarrollo** | Repositorio con la maqueta funcionando, esquema `V1`/`V2`, y el primer tramo del backend/CI (TASK-001, 002, 004, 033) | ⏳ |

> **Honestidad del estado:** los puntos 10–12 dependen de artefactos que **se producen del 5 al 11 de octubre** (Figma y maqueta). Hasta entonces el informe no debe presentarlos como completos. Al terminar, se reemplazan los ⏳ por enlaces y capturas.

---

### 7.2 Cobertura de los temas de la Fase I

#### 7.2.1 Planteamiento (enunciado)
- [x] Identificación del problema → Documento del proyecto §2
- [x] Usuarios y actores → §4
- [x] Alcance → §5
- [x] **Objetivos** (general y específicos, con indicadores) → [§3](../01-definicion/documento-proyecto.md#3-objetivos)
- [x] Requerimientos iniciales → SRS
- [x] Arquitectura preliminar → Arquitectura
- [x] **Uso responsable de IA durante el desarrollo** → [Registro de IA](../04-gestion/ia-register.md)

#### 7.2.2 Especificaciones
- [x] Épicas → SRS §6.1
- [x] Historias de usuario → SRS §6.2
- [x] **División de historias** (HU → US) → SRS §6.2 (columna "Historias divididas")
- [x] Tareas → [Backlog por milestones](../backlog/milestones.md)
- [x] Criterios de aceptación y escenarios BDD → `specs/`
- [x] **Specs** (spec → plan → tareas por módulo) → [`specs/`](../../specs/README.md)

#### 7.2.3 UI/UX
- [x] Wireframes → UX §5
- [ ] Mockups → Figma (TASK-003)
- [ ] Prototipo → Figma + maqueta (TASK-003, 033)
- [ ] HTML DOM y CSS → maqueta (TASK-033)
- [x] Diseño responsive → UX §2.3 y §8 (especificación); verificación en la maqueta
- [x] Usabilidad y UX → UX §7 (plan de evaluación)

#### 7.2.4 JavaScript (maqueta)
- [ ] JavaScript moderno, formularios, validaciones, eventos, manipulación del DOM, `fetch`, API simulada → [UX §6.2](../01-definicion/ux-ui-prototipo.md#62-maqueta-html--css--javascript-con-api-simulada-task-033) (TASK-033)

---

### 7.3 Resumen de lo especificado (para la presentación)

| Elemento | Cantidad |
|:---|:---:|
| Módulos funcionales del enunciado cubiertos | 5 de 5 |
| Requerimientos funcionales / no funcionales / reglas de negocio | 13 / 13 / 19 |
| Épicas / historias de usuario / historias divididas / historias técnicas | 6 / 10 / 29 / 12 |
| Tablas del modelo de datos | 11 |
| Endpoints REST documentados | 57 (ver [API REST](../02-diseno/api-rest.md)) |
| Decisiones de arquitectura registradas (ADR) | 14 |
| Contradicciones detectadas y resueltas en la documentación inicial | 24 ([registro](../02-diseno/decisiones-arquitectura.md#registro-de-conflictos-resueltos-versión-10--20)) |
| Tareas planificadas | ver [backlog](../backlog/README.md) |

---

### 7.4 Decisiones pendientes que el equipo debe confirmar

| # | Decisión | Dónde se registra | Fecha límite |
|:-:|:---|:---|:---:|
| 1 | Tamaño real del equipo (se asumió 6) | [Equipo §1 y §4](../04-gestion/equipo-y-flujo-de-trabajo.md) | 05/10 |
| 2 | Calendario real del curso (se dedujo 24/08 = semana 1) | [Calendario §11](../04-gestion/calendario-y-contingencia.md#11-calendario-vigente) | 05/10 |
| 3 | Dominio institucional de correo (por defecto `universidad.edu`) | [DevOps §5](../03-calidad-y-operacion/devops-despliegue.md#5-variables-de-entorno) | 08/10 |
| 4 | Proveedor cloud ([ADR-007](../02-diseno/decisiones-arquitectura.md#adr-007--plataforma-de-despliegue)) | ADR-007 y [DevOps §9](../03-calidad-y-operacion/devops-despliegue.md#9-plataforma-cloud) | **23/10** |
| 5 | Enlaces de Figma y asignación nominal de roles | UX §6 / Equipo §1 | 09/10 |
| 6 | Validar el esquema `V1`/`V2` contra MySQL 8.0 real | [Modelo de datos](../02-diseno/modelo-datos.md) / TASK-002 | 08/10 |

---

### 7.5 Checklist de entrega a Classroom (Fase I)

- [ ] Informe en PDF generado a partir de los documentos enlazados (con portada y datos del equipo).
- [ ] Wireframes y mockups exportados como imágenes en el informe, con el enlace al prototipo de Figma.
- [ ] Capturas/GIF de la maqueta funcionando y del repositorio con commits convencionales y PR revisados.
- [ ] Registro de IA actualizado ([sección 7](../04-gestion/ia-register.md#7-bitácora-de-entradas-reales)).
- [ ] Presentación de apoyo (≤ 10 diapositivas) que siga los 12 puntos.
- [ ] Revisión final por el Tech Lead de que no hay contradicciones entre documentos (usar el [registro de conflictos](../02-diseno/decisiones-arquitectura.md#registro-de-conflictos-resueltos-versión-10--20) como guía).
