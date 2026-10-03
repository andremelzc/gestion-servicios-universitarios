# Documento del Proyecto (Fase I)

## Sistema Web Inteligente para la Gestión Integral de Servicios Universitarios

| Campo | Valor |
|:---|:---|
| **Curso** | Taller de Construcción de Software Web |
| **Fase** | I — Análisis, especificación y prototipo |
| **Versión del documento** | 1.0 (3 de octubre de 2026) |
| **Estado** | Vigente — fuente de contexto del proyecto |
| **Documentos relacionados** | [SRS](especificaciones-tecnicas.md) · [Arquitectura](../02-diseno/arquitectura-tecnica.md) · [Modelo de datos](../02-diseno/modelo-datos.md) · [API REST](../02-diseno/api-rest.md) · [Calendario y contingencia](../04-gestion/calendario-y-contingencia.md) |

> Este documento responde a los puntos 1–5 de la presentación de la Fase I: **problema, justificación, usuarios, alcance y objetivos**. Los requerimientos detallados viven en el SRS; aquí solo se resumen y se enlazan para no duplicarlos.

---

## 1. Resumen ejecutivo

Las solicitudes de servicio de una universidad (mantenimiento, soporte informático, incidencias de infraestructura, trámites administrativos) hoy circulan por correos, llamadas, formularios y hojas sueltas. El resultado es que se pierden, se duplican, nadie sabe quién es responsable ni cuánto se tarda en atenderlas.

Este proyecto construye una **plataforma web full-stack** que permite registrar, priorizar, asignar, atender y monitorear esas solicitudes, con trazabilidad completa y un panel de indicadores. El producto se entrega **desplegado, probado, asegurado y monitorizado**, y el proceso se documenta de punta a punta (especificar → diseñar → construir → integrar → probar → asegurar → desplegar → monitorear → mejorar).

## 2. Planteamiento del problema

### 2.1 Situación actual

| Canal actual | Problema que genera |
|:---|:---|
| Correos electrónicos | Quedan en bandejas personales; no hay estado ni responsable visible. |
| Llamadas telefónicas | No dejan registro; se pierde el detalle de la incidencia. |
| Formularios o sistemas aislados | Cada área tiene su propio sistema; no hay vista consolidada. |
| Cuadernos de novedades | Sin búsqueda, sin métricas, sin evidencias fotográficas. |

### 2.2 Problemas concretos (los que el sistema debe resolver)

| # | Problema | Cómo lo resuelve el sistema | Requisito |
|:--|:---|:---|:---|
| P1 | Pérdida o duplicación de solicitudes | Registro único con código correlativo `SOL-AAAA-NNNN` | RF-03 |
| P2 | Falta de seguimiento | Máquina de estados con seis estados y vista de seguimiento para el solicitante | RF-04…RF-06 |
| P3 | Ausencia de trazabilidad | Historial inmutable de cada transición (quién, cuándo, qué, nota) | RF-07 |
| P4 | No se sabe quién es responsable | Asignación explícita a un técnico del área, visible para todos | RF-04 |
| P5 | Sin información de tiempos de atención | SLA por prioridad/categoría, MTTR y solicitudes vencidas | RF-08, RN-09…RN-11 |
| P6 | No se mide la calidad del servicio | Calificación de satisfacción (1–5) al cerrar | RF-06 |
| P7 | Sin indicadores para decidir | Dashboard por categoría, prioridad, responsable y estado | RF-08 |

### 2.3 Justificación

- **Académica:** el proyecto integra todo el contenido del curso (especificaciones, UI/UX, JavaScript, React, Spring Boot, MySQL, APIs REST, seguridad, Docker, CI/CD, pruebas, observabilidad) en un único producto verificable.
- **Técnica:** el dominio (tickets con flujo de estados, roles y métricas) es lo bastante rico para exigir transacciones, autorización por rol, agregaciones SQL y auditoría, pero acotado para ser viable en el tiempo disponible.
- **Institucional:** un sistema así reduce tiempos de respuesta, da transparencia al solicitante y entrega datos reales a la gestión (cumplimiento de SLA, carga por técnico, categorías con más incidencias).

## 3. Objetivos

### 3.1 Objetivo general

Construir, probar, asegurar, desplegar y monitorizar una aplicación web full-stack que permita registrar, gestionar, priorizar, atender y monitorear solicitudes de servicios universitarios, garantizando usabilidad, seguridad, calidad, rendimiento y disponibilidad.

### 3.2 Objetivos específicos y cómo se verifican

| ID | Objetivo específico | Indicador de cumplimiento | Evidencia |
|:--|:---|:---|:---|
| OE-1 | Especificar el producto con épicas, historias, criterios BDD y arquitectura | 100 % de las historias *Must* con escenarios BDD y trazabilidad a requisito | SRS §6 y §9; `specs/` |
| OE-2 | Diseñar la experiencia de usuario antes de codificar | Wireframes, mockups y prototipo navegable revisados por el equipo | [Diseño UX/UI](ux-ui-prototipo.md) (wireframes y especificación); mockups y prototipo clicable en Figma (enlace en el documento) |
| OE-3 | Construir un MVP end-to-end | Flujo login → registrar → guardar en MySQL → consultar → cambiar estado, demostrado el 17/10/2026 | Informe de la Fase 1; tag `v0.5.0-mvp` |
| OE-4 | Exponer una API REST documentada y consistente | 100 % de endpoints en OpenAPI/Swagger con códigos HTTP y ejemplos | [API REST](../02-diseno/api-rest.md); `/swagger-ui.html` |
| OE-5 | Asegurar la aplicación según OWASP Top 10 | Matriz de controles implementada y verificada; 0 secretos en el repositorio | [Seguridad](../03-calidad-y-operacion/seguridad-owasp.md); informe SAST/DAST |
| OE-6 | Automatizar integración y despliegue | Pipeline CI/CD verde; despliegue a *staging* automático desde `develop` | [DevOps](../03-calidad-y-operacion/devops-despliegue.md); GitHub Actions |
| OE-7 | Garantizar calidad con pruebas automatizadas | Cobertura de líneas ≥ 70 % (≥ 80 % en servicios de dominio); pruebas de API y de carga | [Estrategia de pruebas](../03-calidad-y-operacion/estrategia-pruebas.md) |
| OE-8 | Observar el sistema en operación | Logs JSON con `traceId`, métricas Prometheus, dashboard y alertas activas | [Observabilidad](../03-calidad-y-operacion/observabilidad.md) |
| OE-9 | Usar la IA como herramienta de ingeniería, con trazabilidad | Registro de IA al día; cada uso significativo con validación y modificaciones | [Registro de IA](../04-gestion/ia-register.md) |
| OE-10 | Entregar documentación y una demostración integral | Manual de usuario, manual técnico, informe de pruebas y demo en vivo | [Entregables y sustentación](../05-entregables/informes-y-sustentacion.md) |

## 4. Actores y usuarios

| Actor | Descripción | Necesidad principal | Acceso |
|:---|:---|:---|:---|
| **Estudiante / Solicitante** | Estudiante, docente o personal que reporta un problema. Se autoregistra. | Reportar con evidencia y saber en qué estado está su solicitud. | Sus propias solicitudes |
| **Técnico** | Personal operativo de un área (TI, mantenimiento…). | Ver qué tiene asignado, registrar el avance y resolver. | Solicitudes asignadas a él |
| **Supervisor** | Jefe de cuadrilla o de área. | Evaluar, priorizar, asignar y vigilar tiempos. | Solicitudes y métricas de su área |
| **Administrador** | Responsable del sistema. | Mantener usuarios, roles, áreas, categorías, prioridades y estados. | Todo el sistema |
| **Sistema (actor secundario)** | Procesos automáticos. | Generar códigos, calcular SLA y registrar historial. | Interno |

> **Nota sobre "Docente":** el enunciado menciona estudiantes, docentes y personal administrativo como solicitantes. Para no multiplicar roles sin necesidad, todos ellos usan el rol de seguridad `ESTUDIANTE` (nombre histórico del rol "Solicitante"). Si el equipo decide diferenciarlos, basta con añadir un rol en la tabla `roles`; no cambia la arquitectura.

## 5. Alcance

### 5.1 Dentro del alcance

| Módulo del enunciado | Alcance concreto | Prioridad (MoSCoW) |
|:---|:---|:---:|
| **1. Autenticación** | Login, registro de estudiantes, JWT, roles, cierre de sesión, cambio de contraseña | Must |
| **2. Registro de solicitudes** | Código, usuario, categoría, descripción, ubicación, prioridad, fecha, estado, responsable, evidencias y comentarios | Must |
| **3. Gestión de solicitudes** | Evaluar, asignar, atender, resolver y cerrar; historial | Must |
| **4. Dashboard** | Registradas, pendientes, atendidas, por categoría, por prioridad, tiempo promedio (MTTR), % resueltas, vencidas, por responsable | Must |
| **5. Administración** | CRUD con baja lógica de usuarios, roles (asignación), categorías, prioridades, áreas; edición de la presentación de estados | Must |
| **Transversal** | Docker, CI/CD, OWASP, pruebas, observabilidad, registro de IA, manuales | Must |

### 5.2 Fuera del alcance

- Pasarelas de pago y transacciones monetarias.
- Integración con hardware (cerraduras, torniquetes, IoT).
- Aplicaciones móviles nativas (la SPA es responsive).
- **Reservas de ambientes:** el enunciado las cita solo como ejemplo de posible uso; no es un módulo mínimo y se excluye para proteger la viabilidad.
- Notificaciones (in-app, correo, SMS o *push*), recuperación de contraseña por correo y bloqueo de cuentas por intentos fallidos. Tampoco los estados `Rechazada` y `Cancelada`, reabrir ni calificar el servicio: el enunciado define 6 estados (recortado el 03/10/2026).
- Integración con directorios institucionales (LDAP/SSO). Se documenta como evolución futura.
- Refresh tokens y revocación de JWT (ver [ADR-004](../02-diseno/decisiones-arquitectura.md#adr-004--jwt-de-8-horas-sin-refresh-token)).

### 5.3 Supuestos

| # | Supuesto | Si es falso… |
|:--|:---|:---|
| S1 | El equipo es de **6 integrantes** (el enunciado no fija el número). | Se redistribuyen roles según [Equipo y roles](../04-gestion/equipo-y-flujo-de-trabajo.md) §4. |
| S2 | El dominio institucional es configurable (`ALLOWED_EMAIL_DOMAIN`); el valor por defecto es `universidad.edu`. | Se cambia la variable de entorno; no hay cambios de código. |
| S3 | El ciclo académico dura 16 semanas (24-ago a 12-dic-2026), con **dos únicas presentaciones**: la de la **semana 8** (17-oct) y la de la **semana 12** (14-nov). *El inicio del ciclo (24-ago) es deducido; confirmar contra el calendario del curso.* | Se ajustan fechas en el [Calendario y contingencia](../04-gestion/calendario-y-contingencia.md). |
| S4 | Hay acceso a una plataforma cloud o VM gratuita/educativa para el despliegue de demostración. | Se despliega con Docker Compose en una máquina del equipo y se documenta la limitación. |

### 5.4 Restricciones

- Stack impuesto por el curso: React, JavaScript, Spring Boot, MySQL, Docker, GitHub.
- Tiempo: del 5 de octubre al 14 de noviembre de 2026 para ejecutar (6 semanas efectivas).
- Todo uso de IA debe quedar registrado ([Registro de IA](../04-gestion/ia-register.md)).
- No se calificará "que funcione" sino el ciclo completo de construcción del producto.

## 6. Riesgos del proyecto

| ID | Riesgo | Prob. | Impacto | Mitigación | Responsable |
|:--|:---|:---:|:---:|:---|:---:|
| R1 | MVP incompleto el 17/10 por tiempo corto (~2 semanas) | Alta | Alto | Alcance MVP congelado a lo mínimo ([Calendario y contingencia](../04-gestion/calendario-y-contingencia.md) §3); datos maestros sembrados desde V2; *daily* 3×/semana | Rol 1 |
| R2 | Dependencias entre frontend y backend bloquean al equipo | Media | Alto | Contrato OpenAPI primero ([API REST](../02-diseno/api-rest.md)); frontend con *mocks* hasta tener endpoint | Rol 1 |
| R3 | Deriva entre documentos (contradicciones) | Alta | Medio | Fuente única por tema ([ADR-010](../02-diseno/decisiones-arquitectura.md#adr-010--fuente-única-de-verdad-por-tema)); revisión en cada PR de docs | Rol 1 |
| R4 | Sin cloud elegido a tiempo para la Fase 2 | Media | Alto | Decisión de plataforma antes del 23/10 ([ADR-007](../02-diseno/decisiones-arquitectura.md#adr-007--plataforma-de-despliegue)); plan B con Docker Compose local | Rol 6 |
| R5 | Vulnerabilidades por subida de archivos | Media | Alto | Validación por contenido, nombres aleatorios, almacenamiento fuera del *webroot*, límite de tamaño ([Seguridad](../03-calidad-y-operacion/seguridad-owasp.md) §4) | Rol 6 |
| R6 | Rendimiento insuficiente del dashboard | Baja | Medio | Agregaciones SQL con índices; pruebas de carga desde Fase III | Rol 3 |
| R7 | Uso de IA sin comprensión ni registro | Media | Alto | Reglas de aceptación del [Registro de IA](../04-gestion/ia-register.md); auditoría semanal | Todos |
| R8 | Sobrecarga de roles (Tech Lead y QA/DevOps concentran tareas) | Alta | Medio | Reasignación de tareas ([Equipo y roles](../04-gestion/equipo-y-flujo-de-trabajo.md) §3) | Rol 1 |
| R9 | Pérdida de datos de demo antes de la sustentación | Baja | Alto | *Seed* reproducible, ambiente de demo limpio ensayado | Rol 6 |
| R10 | Integrante ausente o baja de carga | Media | Medio | Revisión cruzada de PR; ningún módulo con un único conocedor | Rol 1 |

## 7. Criterios de éxito

El proyecto se considera exitoso si, a fecha de sustentación (14/11/2026):

1. Existe una aplicación desplegada y accesible que ejecuta el flujo completo con los cuatro roles.
2. Todas las historias *Must* están implementadas y sus escenarios BDD pasan (manual o automatizado).
3. El pipeline CI/CD está en verde y despliega sin pasos manuales ocultos.
4. No hay secretos en el repositorio y el informe SAST/DAST no tiene hallazgos altos/críticos abiertos.
5. Hay métricas, logs con `traceId` y al menos 3 alertas funcionando.
6. Existe informe de pruebas (unitarias, integración, API, aceptación, usuario, seguridad, carga y estrés).
7. El Registro de IA está al día y cada integrante puede explicar su código.
8. Se entregan manual de usuario, manual técnico y una demostración integral, no solo diapositivas.

## 8. Glosario

| Término | Definición |
|:---|:---|
| **Solicitud / Ticket** | Requerimiento o incidencia registrada por un usuario. |
| **SLA** | Acuerdo de nivel de servicio: tiempo máximo de atención en horas. |
| **MTTR** | *Mean Time To Resolve*: promedio de horas entre el registro y la resolución. |
| **Solicitud vencida** | Solicitud abierta cuya fecha límite de SLA ya pasó. |
| **Solicitud pendiente** | Solicitud en `REGISTRADA`, `EN_EVALUACION`, `ASIGNADA` o `EN_ATENCION`. |
| **Solicitud atendida / resuelta** | Solicitud en `RESUELTA` o `CERRADA`. |
| **Baja lógica** | Marcar un registro como `activo = false` en lugar de borrarlo. |
| **RBAC** | Control de acceso basado en roles. |
| **BDD** | *Behavior-Driven Development*: criterios de aceptación en Gherkin (Dado/Cuando/Entonces). |
| **SDD** | *Spec-Driven Development*: flujo spec → plan → tareas de `specs/`. |
| **MVP** | Producto mínimo viable (presentación de la semana 8). |
| **SAST / DAST** | Análisis de seguridad estático del código / dinámico de la aplicación en ejecución. |
| **OTel** | OpenTelemetry. |
| **DoD** | *Definition of Done*: criterios para considerar terminada una tarea ([Gobernanza](../04-gestion/equipo-y-flujo-de-trabajo.md) §4). |
