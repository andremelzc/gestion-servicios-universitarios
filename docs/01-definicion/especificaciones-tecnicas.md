# Especificación de Requerimientos del Software (SRS)

## Sistema Web Inteligente para la Gestión Integral de Servicios Universitarios

| Campo | Valor |
|:---|:---|
| **Estándar de referencia** | IEEE 830 / ISO/IEC/IEEE 29148 (adaptado a un proyecto académico ágil) |
| **Versión** | 2.0 — 3 de octubre de 2026 |
| **Estado** | Vigente |
| **Presentación 1 — MVP (semana 8)** | 17 de octubre de 2026 |
| **Presentación 2 y sustentación final (semana 12)** | 14 de noviembre de 2026 |

---

## 1. Introducción

### 1.1 Propósito

Este documento es la **fuente única de verdad de los requerimientos**: qué debe hacer el sistema (RF), con qué calidad (RNF), bajo qué reglas de negocio (RN) y cómo se organiza el trabajo en épicas e historias. Lo leen el equipo, el docente y quien evalúe el proyecto.

### 1.2 Qué contiene y qué NO contiene

Para evitar que los documentos se contradigan, cada tema tiene **un solo lugar** (ver [ADR-010](../02-diseno/decisiones-arquitectura.md#adr-010--fuente-única-de-verdad-por-tema)):

| Tema | Fuente única | Este SRS… |
|:---|:---|:---|
| Contexto, problema, objetivos, riesgos | [Documento del proyecto](documento-proyecto.md) | lo enlaza |
| Requerimientos RF / RNF / RN | **este documento** | lo define |
| Escenarios BDD detallados (Gherkin) | `specs/NN-*/01-spec.md` | los indexa |
| Contratos de API (endpoints, JSON, códigos) | [API REST](../02-diseno/api-rest.md) | lo enlaza |
| Esquema físico (DDL) | [`database/migrations/`](../../database/migrations/V1__esquema_inicial.sql) | lo enlaza |
| Diccionario de datos | [Modelo de datos](../02-diseno/modelo-datos.md) | lo enlaza |
| Arquitectura y máquina de estados | [Arquitectura técnica](../02-diseno/arquitectura-tecnica.md) | lo enlaza |
| Seguridad / DevOps / Observabilidad / Pruebas | documentos homónimos | los enlaza |
| Calendario y tareas | [Calendario y contingencia](../04-gestion/calendario-y-contingencia.md) | lo enlaza |

### 1.3 Convenciones

- **Prioridad (MoSCoW):** **M**ust (imprescindible), **S**hould (importante), **C**ould (deseable). Todo lo *Must* debe estar en la sustentación.
- **Identificadores:** `RF-xx` funcional · `RNF-xx` no funcional · `RN-xx` regla de negocio · `HU-xx` historia de usuario (épica) · `US-xx` historia dividida (unidad de trabajo) · `TS-xx` historia técnica · `CA-n` criterio de aceptación dentro de un spec · `TASK-xxx` tarea de planificación.
- **Roles de seguridad:** `ESTUDIANTE`, `TECNICO`, `SUPERVISOR`, `ADMIN` (en BD con prefijo `ROLE_`).
- Los textos "debe / no debe" son obligatorios; "debería" es recomendado.

---

## 2. Descripción general

### 2.1 Perspectiva del producto

Aplicación web de tres capas, desacoplada: SPA React → API REST Spring Boot (stateless, JWT) → MySQL 8. Se despliega en contenedores Docker. Detalle en [Arquitectura técnica](../02-diseno/arquitectura-tecnica.md).

### 2.2 Actores y permisos por módulo

| Módulo | Estudiante | Técnico | Supervisor | Administrador |
|:---|:---|:---|:---|:---|
| **1. Autenticación** | Registro, login, cambio de contraseña | Login, cambio de contraseña | Login, cambio de contraseña | Login, desactivación de cuentas |
| **2. Registro de solicitudes** | Crear; adjuntar evidencias; ver las propias | Ver las asignadas | Ver las de su área; crear en nombre de terceros *(Could)* | Ver todas; anular en auditoría |
| **3. Gestión** | Seguir estado; cerrar; comentar | Iniciar atención; resolver con informe y evidencia; comentar (incl. privado) | Evaluar, priorizar, asignar/reasignar; cerrar; comentar | Todas las acciones operativas; consulta de auditoría |
| **4. Dashboard** | Sin acceso | KPIs propios (sus asignadas) | KPIs de su área | KPIs globales |
| **5. Administración** | Sin acceso | Sin acceso | Consulta de técnicos de su área | CRUD de usuarios, roles, áreas, categorías, prioridades; edición de estados |

> La matriz de permisos **por endpoint** está en [API REST §4](../02-diseno/api-rest.md#4-matriz-de-autorización-por-endpoint).

### 2.3 Entorno operativo

- Navegadores: Chrome, Firefox, Edge y Safari (últimas 2 versiones).
- Resoluciones: 375×667 (móvil) a 1920×1080 (escritorio).
- Servidor: Linux con Docker; Java 17; MySQL 8.0; Node 20 solo para compilar el frontend.

Supuestos, restricciones y exclusiones: [Documento del proyecto §5](documento-proyecto.md#5-alcance).

---

## 3. Requerimientos funcionales (RF)

| ID | Requerimiento | Módulo | Prioridad | Historias |
|:---|:---|:---:|:---:|:---|
| **RF-01** | **Autenticación.** El sistema debe autenticar con correo institucional y contraseña (BCrypt, coste 12) y emitir un JWT firmado HS256. | 1 | M | HU-01 |
| **RF-02** | **Registro de usuarios.** Autoregistro de estudiantes validando dominio institucional, código institucional y robustez de contraseña; el rol se fuerza en el servidor. | 1 | M | HU-07 |
| **RF-03** | **Registro de solicitudes.** Crear una solicitud con código autogenerado, categoría, prioridad, título, descripción, ubicación (campus + ambiente) y hasta 3 evidencias (JPG/PNG/PDF). Estado inicial `REGISTRADA`. | 2 | M | HU-02 |
| **RF-04** | **Evaluación y asignación.** El supervisor evalúa (`EN_EVALUACION`), ajusta la prioridad y asigna a un técnico activo del área de la categoría (`ASIGNADA`). Puede reasignar mientras no esté `RESUELTA`. | 3 | M | HU-03 |
| **RF-05** | **Atención y resolución.** El técnico asignado inicia la atención (`EN_ATENCION`) y resuelve (`RESUELTA`) con informe técnico y ≥ 1 evidencia de solución. | 3 | M | HU-04 |
| **RF-06** | **Cierre y conformidad.** El solicitante o el supervisor cierran la solicitud (`CERRADA`) al confirmar la solución. | 3 | M | HU-09 |
| **RF-07** | **Trazabilidad.** Cada transición se registra de forma inmutable: estado anterior/nuevo, actor, nota y marca de tiempo, en la misma transacción que el cambio. | 3 | M | HU-03, HU-04, HU-09 |
| **RF-08** | **Métricas.** Panel con: registradas, pendientes, atendidas, % resueltas, MTTR, vencidas, y distribuciones por categoría, prioridad, estado y responsable, con filtro por fechas. El alcance de los datos depende del rol (RN-16). | 4 | M | HU-05 |
| **RF-09** | **Catálogos.** CRUD con baja lógica de áreas, categorías (con SLA) y prioridades (con SLA); edición de nombre visible/color/descripción de los estados. | 5 | M | HU-06 |
| **RF-10** | **Usuarios y roles.** El administrador crea, edita, desactiva usuarios y asigna roles y área. | 5 | M | HU-06 |
| **RF-11** | **Credenciales.** Cambio de contraseña autenticado. | 1 | M | HU-07 |
| **RF-12** | **Seguimiento.** El solicitante lista y filtra sus solicitudes y ve el detalle con línea de tiempo del historial. Supervisores/técnicos disponen de una bandeja con filtros por estado, prioridad, categoría, técnico y búsqueda por código. | 2, 3 | M | HU-08 |
| **RF-13** | **Comentarios.** Comentarios por solicitud; los marcados como privados de cuadrilla solo los ven técnicos, supervisores y administradores. | 2 | S | HU-10 |

> *RF-14 (rechazo y cancelación) y RF-15 (notificaciones) se retiraron del alcance el 03/10/2026 para ajustarse a lo que pide el enunciado: los estados son los 6 del PDF.*

---

## 4. Reglas de negocio (RN)

| ID | Regla |
|:---|:---|
| **RN-01** | El código de solicitud tiene el formato `SOL-AAAA-NNNN` (AAAA = año de registro; NNNN = correlativo anual con relleno de ceros a 4 dígitos, que crece si supera 9999). Es único y se genera dentro de la transacción de alta usando `secuencias_solicitud` con incremento atómico. |
| **RN-02** | Solo se permite el registro con correos del dominio institucional configurado (`ALLOWED_EMAIL_DOMAIN`). La comparación es insensible a mayúsculas y los correos se guardan en minúsculas. |
| **RN-03** | La contraseña debe tener ≥ 8 caracteres, al menos 1 mayúscula y 1 número, y no puede coincidir con el correo. |
| **RN-04** | El registro público **no acepta** el rol: siempre se crea `ESTUDIANTE`. Los demás roles los asigna el administrador. |
| **RN-06** | Solo existen las transiciones de la [matriz de estados](../02-diseno/arquitectura-tecnica.md#22-matriz-de-transiciones-y-permisos). Cualquier otra se rechaza con HTTP 409. |
| **RN-07** | Solo puede asignarse un técnico **activo** cuyo `id_area` coincide con el área de la categoría de la solicitud. La asignación puede hacerse desde `REGISTRADA` (el sistema registra implícitamente el paso por `EN_EVALUACION` en el historial) o desde `EN_EVALUACION`. |
| **RN-09** | `fecha_limite_sla = fecha_registro + MIN(prioridad.sla_max_horas, categoria.tiempo_sla_horas)` horas. Se recalcula si el supervisor cambia la prioridad. El cómputo es en horas corridas (no hábiles). |
| **RN-10** | Una solicitud está **vencida** si su estado es *pendiente* y `ahora > fecha_limite_sla`. |
| **RN-11** | **Definiciones de métricas.** *Pendientes* = `REGISTRADA`, `EN_EVALUACION`, `ASIGNADA`, `EN_ATENCION`. *Atendidas/resueltas* = `RESUELTA`, `CERRADA`. *Registradas* = total de solicitudes. **% resueltas** = resueltas ÷ registradas. **MTTR** = promedio de (`fecha_resolucion` − `fecha_registro`) en horas, solo para resueltas con `fecha_resolucion` no nula. |
| **RN-12** | Para pasar a `RESUELTA` se requiere informe técnico de ≥ 20 caracteres y al menos 1 evidencia tipo `SOLUCION`. Se registra `fecha_resolucion`. |
| **RN-14** | **Baja lógica:** `usuarios`, `areas`, `categorias` y `prioridades` no se borran; se marcan `activo = false`. Un catálogo inactivo no aparece en los formularios pero sigue visible en solicitudes históricas. |
| **RN-15** | Evidencias: tipos `image/jpeg`, `image/png`, `application/pdf`; ≤ 5 MB c/u; ≤ 3 por acción (alta o resolución). El tipo se valida por **contenido** (firma de archivo), no solo por extensión. |
| **RN-16** | **Aislamiento de datos:** el estudiante ve solo sus solicitudes; el técnico solo las asignadas a él; el supervisor las de su área (por área de la categoría); el administrador todas. Acceder a una solicitud fuera del alcance responde **404** (no 403) para no revelar su existencia. |
| **RN-17** | Toda transición escribe una fila en `historial_solicitudes` en la misma transacción. El historial no se edita ni se borra (triggers en BD). |
| **RN-18** | Los campos de texto libre no admiten HTML: si contienen etiquetas se rechazan con HTTP 400. La salida se escapa además en el frontend. |
| **RN-19** | Un comentario `es_privado_cuadrilla = true` solo es visible para `TECNICO`, `SUPERVISOR` y `ADMIN`. Solo el solicitante, el técnico asignado, el supervisor del área y el admin pueden comentar, y no en estados finales. |
| **RN-21** | Un usuario con rol `TECNICO` o `SUPERVISOR` debe tener un área. Un `ESTUDIANTE` no tiene área. |
| **RN-22** | El backend verifica en **cada petición** que el usuario del token siga activo; desactivar una cuenta corta el acceso aunque el JWT no haya expirado. |
| **RN-23** | La prioridad inicial la propone el solicitante; la prioridad definitiva la fija el supervisor al evaluar. |

> *RN-05 (bloqueo por intentos), RN-08 (rechazo/cancelación), RN-13 (calificación/reapertura) y RN-20 (notificaciones) se retiraron del alcance el 03/10/2026; la numeración se conserva.*

---

## 5. Requerimientos no funcionales (RNF)

| ID | Categoría | Requerimiento | Métrica / criterio | Cómo se verifica |
|:---|:---|:---|:---|:---|
| **RNF-01** | Seguridad | Mitigar OWASP Top 10: SQL injection (JPA parametrizado), XSS, control de acceso, secretos fuera del código, cabeceras seguras, CORS estricto. | Matriz [Seguridad](../03-calidad-y-operacion/seguridad-owasp.md) 100 % implementada; 0 hallazgos altos/críticos | SAST (CodeQL), DAST (ZAP), `gitleaks`, revisión de código |
| **RNF-02** | Rendimiento | Tiempo de respuesta de la API. | **P95 ≤ 300 ms** con 50 usuarios virtuales concurrentes; error < 1 %. *Excepción justificada:* `POST /auth/login` (BCrypt coste 12 es deliberadamente costoso) con objetivo P95 ≤ 800 ms | k6 ([Pruebas](../03-calidad-y-operacion/estrategia-pruebas.md#8-pruebas-de-carga-y-estrés)) |
| **RNF-03** | Escalabilidad | Backend *stateless*: sin sesión en servidor. | Dos réplicas detrás del proxy funcionan sin afinidad de sesión | Prueba de despliegue con 2 réplicas |
| **RNF-04** | Integridad | Operaciones atómicas (ACID) para alta, transición e historial. | 0 registros huérfanos tras fallos inyectados | Pruebas de integración con rollback |
| **RNF-05** | Usabilidad | UI responsive y consistente; tareas frecuentes en ≤ 3 clics. | SUS ≥ 70 en pruebas con ≥ 5 usuarios; sin scroll horizontal en 375 px | [UX/UI §7](ux-ui-prototipo.md#7-evaluación-de-usabilidad) |
| **RNF-06** | Observabilidad | Logs JSON con `traceId`; métricas Prometheus; trazas OTel. | 100 % de peticiones con `X-Trace-Id`; 3+ alertas activas | [Observabilidad](../03-calidad-y-operacion/observabilidad.md) |
| **RNF-07** | Disponibilidad | El servicio se recupera solo ante caídas de proceso. | `restart: unless-stopped`, *healthchecks*; disponibilidad ≥ 99 % durante el periodo de demostración | Monitoreo + prueba de caída |
| **RNF-08** | Mantenibilidad | Arquitectura por capas, código revisado, sin duplicación. | Cobertura de líneas ≥ 70 % (≥ 80 % en `service`); 0 *code smells* bloqueantes | JaCoCo + Sonar/CodeQL |
| **RNF-09** | Portabilidad | Todo el sistema arranca con un solo comando. | `docker compose up` deja backend, frontend y BD operativos sin instalaciones manuales | Prueba en máquina limpia |
| **RNF-10** | Accesibilidad | Cumplimiento básico WCAG 2.1 AA (contraste, foco, etiquetas, teclado). | Revisión manual con la lista de accesibilidad (contraste, foco, etiquetas, teclado) en las 4 pantallas clave | Revisión manual |
| **RNF-11** | Documentación de API | La API está documentada y es consultable. | 100 % de endpoints en OpenAPI; Swagger UI accesible en no-producción | Revisión + test de contrato |
| **RNF-12** | Dashboard | Consultas agregadas en BD, no en memoria. | Respuesta P95 ≤ 300 ms con ~2 000 solicitudes sembradas (objetivo de diseño 150 ms) | k6 + `EXPLAIN` |
| **RNF-13** | Privacidad | Mínimo de datos personales; no se registran contraseñas ni tokens en logs. | 0 secretos/PII sensibles en logs | Revisión de logs + pruebas |

---

## 6. Épicas e historias de usuario

El proyecto se organiza en **5 épicas funcionales** y **10 historias de usuario (HU)** que se **dividen** en historias más pequeñas (US) para poder estimarlas, asignarlas y mergearlas en un solo PR. Los criterios de aceptación en Gherkin están en el `spec` de cada módulo; aquí solo se indexan.

### 6.1 Épicas

| Épica | Nombre | Módulo(s) | Spec | Prioridad |
|:---:|:---|:---:|:---|:---:|
| **E1** | Autenticación y control de accesos | 1 | [`specs/01-autenticacion`](../../specs/01-autenticacion/01-spec.md) | M |
| **E2** | Registro y seguimiento de solicitudes | 2 | [`specs/02-registro-solicitudes`](../../specs/02-registro-solicitudes/01-spec.md) | M |
| **E3** | Gestión y ciclo de vida de solicitudes | 3 | [`specs/03-gestion-solicitudes`](../../specs/03-gestion-solicitudes/01-spec.md) | M |
| **E4** | Dashboard e indicadores | 4 | [`specs/04-dashboard`](../../specs/04-dashboard/01-spec.md) | M |
| **E5** | Administración de catálogos y usuarios | 5 | [`specs/05-administracion`](../../specs/05-administracion/01-spec.md) | M |
| **ET** | Épica técnica: DevOps, seguridad, calidad, UX e IA | transversal | specs 06, 07, 08 | M |

### 6.2 Historias de usuario y su división

| HU | Historia (resumen) | Épica | Prioridad | Historias divididas (US) |
|:---|:---|:---:|:---:|:---|
| **HU-01** | Como usuario del sistema quiero iniciar sesión con mi correo institucional para acceder a lo que corresponde a mi rol. | E1 | M | US-01 Login · US-04 Logout |
| **HU-07** | Como estudiante nuevo quiero registrarme y gestionar mi contraseña para usar el sistema sin depender de un administrador. | E1 | M | US-02 Registro · US-03 Rol forzado · US-18 Cambiar contraseña |
| **HU-02** | Como estudiante o docente quiero registrar una solicitud con categoría, ubicación, descripción y fotos para que el área intervenga. | E2 | M | US-05 Formulario · US-06 Evidencia · US-07 Código único |
| **HU-08** | Como solicitante quiero ver el estado y el historial de mis solicitudes. | E2 | M | US-21 Mis solicitudes y detalle |
| **HU-03** | Como supervisor quiero evaluar, priorizar y asignar solicitudes de mi área para que comience la atención. | E3 | M | US-08 Asignar técnico · US-23 Evaluar y priorizar |
| **HU-04** | Como técnico quiero iniciar la atención y resolver con informe y evidencia para dar por solucionado el problema. | E3 | M | US-09 Iniciar atención · US-10 Resolver · US-11 Historial automático |
| **HU-09** | Como solicitante o supervisor quiero confirmar la solución para cerrar la solicitud. | E3 | M | US-25 Cerrar |
| **HU-10** | Como participante de una solicitud quiero comentar para aclarar dudas sin salir del sistema. | E3 | S | US-27 Comentarios (públicos y privados) |
| **HU-05** | Como supervisor o administrador quiero un panel con volumen, tiempos y estado para decidir y medir el SLA. | E4 | M | US-12 KPIs de volumen · US-13 Por categoría · US-14 MTTR · US-28 Por prioridad y estado · US-29 Vencidas · US-30 Por responsable y % resueltas |
| **HU-06** | Como administrador quiero gestionar usuarios, roles y catálogos para mantener el sistema vigente sin tocar la BD. | E5 | M | US-15 Categorías · US-16 Vínculo categoría–área · US-17 Roles de usuario · US-31 Prioridades y SLA · US-32 Estados (presentación) · US-33 Áreas · US-34 Usuarios (alta/baja) |

### 6.3 Historias técnicas (épica ET)

| ID | Historia técnica | Spec | Prioridad |
|:---|:---|:---|:---:|
| TS-01 | Contenerizar frontend, backend y BD con Docker/Compose. | 06 | M |
| TS-02 | Pipeline de integración continua (build, pruebas, cobertura, SAST). | 06 | M |
| TS-03 | Pipeline de despliegue continuo a *staging* y *producción*. | 06 | M |
| TS-04 | Seguridad aplicativa OWASP y gestión de secretos. | 06 | M |
| TS-05 | Observabilidad: logs, métricas, trazas, alertas. | 07 | M |
| TS-06 | Pruebas unitarias, de integración y de API automatizadas. | 07 | M |
| TS-07 | Pruebas de carga y estrés. | 07 | M |
| TS-08 | Pruebas de seguridad SAST y DAST. | 06 / 07 | M |
| TS-09 | Documentación de la API con OpenAPI/Swagger. | 06 | M |
| TS-10 | Registro de uso de IA. | 08 | M |
| TS-11 | Diseño UX/UI: wireframes, mockups, prototipo. | 08 | M |
| TS-12 | Manuales, informe de pruebas y preparación de la sustentación. | 08 | M |

### 6.4 Definición de *Ready* y *Done*

- **Ready (para entrar a un sprint):** tiene enunciado "Como/Quiero/Para", ≥ 2 escenarios BDD (uno feliz y uno de error), dependencias identificadas y estimación.
- **Done:** definido en [Gobernanza Git §4](../04-gestion/equipo-y-flujo-de-trabajo.md#4-definición-de-hecho-dod).

---

## 7. Alcance del MVP (17/10/2026)

El MVP demuestra el flujo exigido por el enunciado: **login → registrar solicitud → guardar en MySQL → consultar → modificar estado.** Contiene:

| Incluido en MVP | Diferido a Fase III/IV |
|:---|:---|
| US-01, US-02, US-03, US-04 (auth básica con JWT y roles) | US-18 (cambio de contraseña) |
| US-05, US-06 (opcional), US-07 (registrar con código) | US-27 comentarios |
| US-21 (mis solicitudes y detalle) | — |
| US-08, US-09, US-10, US-11 (asignar, iniciar, resolver, historial) | US-23, US-25 (evaluar y cerrar) *— cerrar entra al MVP si hay tiempo* |
| Datos maestros sembrados (V2) | US-12…US-14, US-28…US-30 (dashboard) |
| — | US-15…US-17, US-31…US-34 (administración) |

> El MVP usa datos maestros sembrados porque el CRUD de catálogos llega después (TASK-018): sin categorías, áreas y prioridades no se puede registrar ninguna solicitud. Ver [Calendario §3](../04-gestion/calendario-y-contingencia.md#3-alcance-del-mvp-y-dependencias-críticas).

---

## 8. Interfaces externas

| Interfaz | Descripción | Referencia |
|:---|:---|:---|
| Usuario | SPA React responsive; 4 pantallas clave diseñadas antes de codificar | [UX/UI](ux-ui-prototipo.md) |
| API | REST JSON sobre HTTPS, versionada en `/api/v1`, errores RFC 7807 | [API REST](../02-diseno/api-rest.md) |
| Datos | MySQL 8 con migraciones Flyway | [Modelo de datos](../02-diseno/modelo-datos.md) |
| Almacenamiento de archivos | Volumen Docker montado fuera del *webroot* (evolución: bucket S3/MinIO) | [Arquitectura §5](../02-diseno/arquitectura-tecnica.md) |
| Observabilidad | Endpoints Actuator/Prometheus y exportador OTLP | [Observabilidad](../03-calidad-y-operacion/observabilidad.md) |

---

## 9. Matriz de trazabilidad

Cada problema del proyecto se rastrea hasta el requisito, la historia, la tarea y la prueba. Las pruebas se nombran con el patrón `CA-n` del spec para poder auditar la cobertura de criterios.

| Problema | RF / RNF | HU → US | Spec | Tareas | Evidencia de prueba |
|:---|:---|:---|:---|:---|:---|
| P1 Pérdida/duplicación | RF-03, RN-01 | HU-02 → US-05, US-07 | 02 | TASK-006, 007, 008 | `SolicitudServiceTest#generaCodigoUnico`, API `POST /solicitudes` |
| P2 Falta de seguimiento | RF-12, RF-04…06 | HU-08, HU-03, HU-04, HU-09 | 02, 03 | TASK-009…011, 034 | BDD estados; E2E MVP |
| P3 Sin trazabilidad | RF-07, RN-17 | HU-04 → US-11 | 03 | TASK-009 | `HistorialInmutableIT` (trigger) |
| P4 Responsable desconocido | RF-04, RN-07 | HU-03 → US-08 | 03 | TASK-010 | `AsignacionTest` (403/área) |
| P5 Sin tiempos | RF-08, RN-09…11 | HU-05 → US-14, US-29 | 04 | TASK-016, 017 | `DashboardRepositoryIT` |
| P6 Calidad no medida | RF-08, RN-11 | HU-05 → US-14, US-30 | 04 | TASK-016, 017 | `DashboardRepositoryIT` (MTTR y % resueltas) |
| P7 Sin indicadores | RF-08 | HU-05 → US-12, 13, 28, 30 | 04 | TASK-016, 017 | k6 dashboard; UAT |
| — Seguridad | RNF-01, RN-02…04, 15, 16, 18, 22 | TS-04, TS-08, HU-01, HU-07 | 06, 01 | TASK-004, 019, 029, 032 | Matriz OWASP; ZAP; pruebas de autorización |
| — Operación | RNF-06, RNF-07 | TS-05 | 07 | TASK-020, 030 | Alertas disparadas en simulacro |
| — Calidad | RNF-02, RNF-08, RNF-12 | TS-06, TS-07 | 07 | TASK-012, 021, 031, 036, 037 | Informe de pruebas |
| — Despliegue | RNF-03, RNF-09 | TS-01…TS-03 | 06 | TASK-015, 028 | Pipeline verde; demo desplegada |

---

## 10. Control de cambios del documento

| Versión | Fecha | Cambios |
|:---|:---|:---|
| 1.0 | 2026-10-02 | Primera versión: RF/RNF, 6 HU con BDD, arquitectura y esquema embebidos. |
| 2.0 | 2026-10-03 | Reestructurado como fuente única de requerimientos. Se agregan RN-01…RN-23, RF-11…RF-15, RNF-07…RNF-13, división de historias (US), historias técnicas, alcance MVP y matriz de trazabilidad. Se unifican: código de ticket `SOL-AAAA-NNNN`, BCrypt 12, adjuntos 5 MB, descripción ≥ 15 caracteres. Arquitectura, modelo de datos y roadmap se mueven a su documento propio. |
| 2.1 | 2026-10-03 | Recorte de alcance al enunciado: 6 estados (se retiran `RECHAZADA`, `CANCELADA`, reabrir y calificación), sin notificaciones, sin recuperación de contraseña ni bloqueo por intentos. Se retiran RF-14, RF-15, RN-05, RN-08, RN-13, RN-20, HU-11 y las US-19, 20, 22, 24, 26 y 35. |
