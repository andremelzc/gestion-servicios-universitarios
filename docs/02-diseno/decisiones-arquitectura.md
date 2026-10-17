# Registro de Decisiones de Arquitectura (ADR)

> Cada decisión técnica relevante queda registrada con su contexto, las alternativas evaluadas y las consecuencias. Esto permite defender el diseño en la sustentación y evita reabrir discusiones ya resueltas.
> **Formato:** contexto → decisión → alternativas → consecuencias. **Estados:** `Aceptada`, `Propuesta` (pendiente de confirmación del equipo), `Reemplazada`.
> Para cambiar una decisión se crea un ADR nuevo que reemplaza al anterior; no se edita el histórico.

## Índice

| ADR | Decisión | Estado |
|:---|:---|:---:|
| [001](#adr-001--stack-react--spring-boot--mysql) | Stack React + Spring Boot + MySQL | Aceptada |
| [002](#adr-002--monolito-modular-con-frontend-desacoplado) | Monolito modular con frontend desacoplado | Aceptada |
| [003](#adr-003--atajo-de-asignación-desde-registrada) | Atajo de asignación desde `REGISTRADA` | Aceptada |
| [004](#adr-004--jwt-de-8-horas-sin-refresh-token) | JWT de 8 horas sin *refresh token* | Aceptada |
| [005](#adr-005--rechazar-html-en-lugar-de-sanitizarlo) | Rechazar HTML en lugar de sanitizarlo | Aceptada |
| [006](#adr-006--nginx-como-api-gateway-ligero) | Nginx como API Gateway ligero | Aceptada |
| [007](#adr-007--plataforma-de-despliegue) | Plataforma de despliegue | Aceptada |
| [008](#adr-008--herramientas-de-prueba-y-seguridad-automatizada) | Herramientas de prueba y seguridad automatizada | Aceptada |
| [009](#adr-009--los-estados-son-un-catálogo-de-presentación-no-de-comportamiento) | Estados: catálogo de presentación, no de comportamiento | Aceptada |
| [010](#adr-010--fuente-única-de-verdad-por-tema) | Fuente única de verdad por tema | Aceptada |
| [011](#adr-011--código-de-solicitud-correlativo-generado-en-base-de-datos) | Código de solicitud correlativo generado en BD | Aceptada |
| [012](#adr-012--errores-con-rfc-7807) | Errores con RFC 7807 | Aceptada |
| [013](#adr-013--migraciones-con-flyway-y-ddl-autovalidate) | Migraciones con Flyway y `ddl-auto=validate` | Aceptada |
| [014](#adr-014--baja-lógica-generalizada-e-historial-inmutable) | Baja lógica generalizada e historial inmutable | Aceptada |

---

## ADR-001 — Stack React + Spring Boot + MySQL

- **Estado:** Aceptada · **Fecha:** 2026-10-03
- **Contexto:** El curso fija el stack (React, JavaScript, Spring Boot, MySQL, Docker, GitHub). Hay que decidir versiones y herramientas de apoyo.
- **Decisión:** React 18 con **Vite** (arranque y *build* rápidos); Spring Boot 3 con Java 17 (LTS); MySQL 8.0 InnoDB; `fetch` nativo; React Router; Recharts.
- **Alternativas:** Create React App (descontinuado); Next.js (SSR innecesario para un panel interno); PostgreSQL (mejor en algunos aspectos, pero el curso exige MySQL).
- **Consecuencias:** (+) alineado con el curso y con abundante documentación; (−) Vite implica **Vitest** como *runner* de pruebas (ver ADR-008).

## ADR-002 — Monolito modular con frontend desacoplado

- **Estado:** Aceptada · **Fecha:** 2026-10-03
- **Contexto:** Equipo de 6 personas, 6 semanas efectivas (05/10–14/11), un dominio acotado.
- **Decisión:** Un único backend Spring Boot **modular por paquetes de funcionalidad** (`auth`, `solicitud`, `catalogo`, `dashboard`…) y una SPA independiente. Sin microservicios.
- **Alternativas:** Microservicios (sobrecosto de despliegue, red y observabilidad sin beneficio real a esta escala).
- **Consecuencias:** (+) despliegue y depuración simples; transacciones ACID locales (RNF-04); (−) un fallo del backend afecta a todo. Se mitiga con *healthchecks* y reinicio automático. Los paquetes con límites claros permiten extraer servicios en el futuro.

## ADR-003 — Atajo de asignación desde `REGISTRADA`

- **Estado:** Aceptada · **Fecha:** 2026-10-03
- **Contexto:** La versión 1.0 era contradictoria: el diagrama y la matriz solo permitían `EN_EVALUACION → ASIGNADA`, pero HU-03 y `specs/03` permitían asignar desde `REGISTRADA`, y un ejemplo de historial mostraba `REGISTRADA → ASIGNADA`.
- **Decisión:** Se permite asignar **directamente desde `REGISTRADA`** como atajo de usabilidad. El servicio registra **ambas** transiciones (`REGISTRADA→EN_EVALUACION` y `EN_EVALUACION→ASIGNADA`) en el historial, en la misma transacción.
- **Alternativas:** (a) Obligar siempre a pulsar "Evaluar" primero — más clics sin valor para el supervisor; (b) permitir saltar sin registrar la evaluación — pierde trazabilidad.
- **Consecuencias:** (+) el historial siempre es consistente con la máquina de estados; el supervisor ahorra un paso; (−) el servicio tiene un caso especial que debe probarse (prueba `asignarDesdeRegistradaRegistraDosFilas`).

## ADR-004 — JWT de 8 horas sin *refresh token*

- **Estado:** Aceptada · **Fecha:** 2026-10-03
- **Contexto:** El enunciado pide "JWT o sesión". Hay que decidir vida del token, almacenamiento en el cliente y revocación. El SRS 1.0 decía "token en memoria"; los `specs` decían `localStorage` y el curso incluye *LocalStorage/SessionStorage* y *cookies* como temas.
- **Decisión:**
  1. **JWT HS256**, vida **8 horas** (`JWT_EXPIRATION_MINUTES=480`, configurable), secreto ≥ 256 bits desde variable de entorno. Claims: `sub` (id de usuario), `rol`, `idArea`, `iat`, `exp`, `jti`.
  2. **Sin refresh token ni lista de revocación.** En su lugar, el backend **verifica en cada petición** que el usuario siga activo (RN-22), lo que permite cortar el acceso de inmediato al desactivar una cuenta.
  3. **Almacenamiento:** el token y el perfil se guardan en **`localStorage`** (clave única `gestion_univ_auth`) y se restauran al cargar la app. Cerrar sesión = borrar la clave.
  4. **`sessionStorage`** se usa para borradores del formulario de nueva solicitud (se pierden al cerrar la pestaña).
  5. **Cookie** `gu_prefs` (solo preferencias de interfaz no sensibles: tema y estado del menú; `SameSite=Lax; Secure; Max-Age=1 año`). **No** contiene credenciales.
- **Alternativas:** (a) Cookie `HttpOnly` + token CSRF — más resistente a robo por XSS, pero exige proteger CSRF y complica CORS en desarrollo; (b) token solo en memoria — más seguro frente a XSS pero cierra la sesión al recargar la página, mala usabilidad; (c) *access + refresh token* — más seguro, pero fuera del alcance en 10 semanas.
- **Consecuencias y riesgo aceptado:** un XSS podría leer el token de `localStorage`. **Mitigaciones obligatorias:** CSP estricta sin `unsafe-inline`; React escapa por defecto y se **prohíbe** `dangerouslySetInnerHTML`; rechazo de HTML en entradas (ADR-005); expiración de 8 h; verificación de usuario activo por petición; revisión de dependencias. **Evolución documentada:** migrar a cookie `HttpOnly` + CSRF si el sistema pasara a producción institucional. Esta decisión y su riesgo se explican en el informe de seguridad.

## ADR-005 — Rechazar HTML en lugar de sanitizarlo

- **Estado:** Aceptada · **Fecha:** 2026-10-03
- **Contexto:** La arquitectura 1.0 hablaba de "sanitizar" las entradas; el spec de DevOps pedía "sanitizar **y** rechazar con 400". Son comportamientos distintos.
- **Decisión:** Los campos de texto libre **no admiten HTML**. Si el texto contiene etiquetas (`<…>`), se **rechaza con 400** y mensaje por campo (anotación `@SinHtml`). No se modifica silenciosamente el texto del usuario. Además, el frontend escapa siempre al renderizar.
- **Alternativas:** Sanitizar con una librería (OWASP Java HTML Sanitizer) — útil si se admitiera texto enriquecido, que aquí no es requisito; añade superficie y puede alterar el contenido.
- **Consecuencias:** (+) comportamiento predecible y testeable (escenario BDD de DevOps); (−) un usuario no puede escribir `<` literalmente (p. ej. "temp < 5°"); aceptable para este dominio, y se informa con un mensaje claro.

## ADR-006 — Nginx como API Gateway ligero

- **Estado:** Aceptada · **Fecha:** 2026-10-03
- **Contexto:** El enunciado incluye "API Gateway". La arquitectura 1.0 mencionaba "Nginx / Spring Cloud Gateway" sin decidir.
- **Decisión:** **Nginx** como único punto de entrada: sirve la SPA, enruta `/api/` al backend, termina TLS, añade cabeceras de seguridad, aplica *rate limiting* y balancea réplicas. No se usa Spring Cloud Gateway.
- **Alternativas:** Spring Cloud Gateway (útil con múltiples microservicios y enrutamiento dinámico; aquí es un salto extra sin necesidad); Kong/Traefik (potentes, más piezas que operar).
- **Consecuencias:** (+) una pieza menos que mantener; configuración declarativa; (−) sin funciones avanzadas (autenticación en el gateway, transformaciones), que no se necesitan.

## ADR-007 — Plataforma de despliegue

- **Estado:** Aceptada · **Fecha:** 2026-10-05
- **Contexto:** Fase III exige "selección de plataforma cloud", ambientes dev/test/prod y despliegue. Las plataformas deben mantener costos en cero para este proyecto universitario. Se descartó Railway debido a que recientemente eliminó su capa 100% gratuita.
- **Opciones evaluadas:**

| Criterio | A. VM + Docker Compose | B. Vercel (Front) + Render (Back/BD) | C. AWS gestionado (ECS + RDS) |
|:---|:---|:---|:---|
| Portabilidad (mismo `docker-compose` en dev y prod) | Alta | Media (config por plataforma) | Baja |
| Soporte de MySQL 8 | Propio (contenedor) | **Integración con proveedor gratuito (ej. Aiven/CleverCloud) en Render** | RDS (de pago) |
| Observabilidad (Prometheus/Grafana) | Incluida en el compose | **Logs en consola integrados** | CloudWatch (de pago) |
| Costo para el curso | Bajo/cero | **100% Gratuito** | Alto |
| Aprendizaje (Docker, redes, TLS) | Alto | Bajo | Alto |
| Riesgo operativo | Mantenimiento del servidor | **Bajo (Servicios gestionados)** | Complejidad |

- **Decisión final:** **Opción B — Vercel para el Frontend y Render para el Backend**. Se utilizará Vercel para servir la SPA de React (Vite) debido a su excelente capa gratuita y CDN global. Render se utilizará para levantar la API de Spring Boot en un Web Service gratuito. Para la Base de Datos MySQL, se optará por un proveedor DBaaS gratuito compatible (como Aiven MySQL o TiDB) conectado a Render.
- **Consecuencias:** (+) Costo $0 absoluto. Despliegue continuo directo desde las ramas de GitHub sin configurar workflows manuales complejos. (−) Las instancias gratuitas de Render "se duermen" (spin-down) tras 15 minutos de inactividad, por lo que la primera petición del día tardará unos 50 segundos en responder (Cold Start).
- **Criterio de decisión final:** Decisión formalizada por André Meléndez el 05/10/2026 priorizando la viabilidad económica del proyecto académico.

## ADR-008 — Herramientas de prueba y seguridad automatizada

- **Estado:** Aceptada · **Fecha:** 2026-10-03
- **Contexto:** Los documentos 1.0 mencionaban "Jest" y "Vitest" indistintamente, "JMeter/K6", y solo "SAST" aunque el enunciado pide SAST **y** DAST.
- **Decisión:**

| Necesidad | Herramienta | Motivo |
|:---|:---|:---|
| Pruebas unitarias backend | JUnit 5 + Mockito + AssertJ | Estándar de Spring. |
| Integración backend | `@SpringBootTest` + **Testcontainers (MySQL 8)** | Misma versión de BD que producción; H2 oculta diferencias de SQL (triggers, `TIMESTAMPDIFF`). |
| Pruebas web/API | MockMvc + RestAssured; colección **Bruno** versionada | Ejecutable en CI. |
| Pruebas frontend | **Vitest** + React Testing Library | Integración nativa con Vite (Jest requeriría configuración extra). |
| Cobertura | JaCoCo (backend), `vitest --coverage` | Umbral en CI. |
| Carga y estrés | **k6** (scripts en JS, umbrales como código) | Los scripts son JavaScript, coherente con el curso. JMeter queda como alternativa. |
| SAST | **GitHub CodeQL** (Java y JavaScript) + gitleaks (secretos) + Dependabot (dependencias) | Gratuito y nativo de GitHub. |
| DAST | **OWASP ZAP** (*baseline* en CI contra *staging*) | Estándar abierto. |
| Secretos | **gitleaks** en CI y *pre-commit* | Evita *hardcode*. |

- **Consecuencias:** (+) cubre exactamente lo que pide la Fase IV; (−) ZAP necesita un ambiente desplegado, por eso depende de la decisión del ADR-007.

## ADR-009 — Los estados son un catálogo de presentación, no de comportamiento

- **Estado:** Aceptada · **Fecha:** 2026-10-03
- **Contexto:** El enunciado pide que el módulo de administración gestione "Estados". Pero la máquina de estados del backend depende de los códigos (`EN_ATENCION`, etc.); si un administrador pudiera crear o borrar estados, rompería el flujo.
- **Decisión:** `estados_solicitud` es un catálogo en BD cuyo **`codigo` es inmutable y fijo**; el administrador puede editar **nombre visible, descripción y color**, pero no crear ni eliminar estados ni alterar transiciones. Las transiciones viven en código (`SolicitudWorkflowService`), versionadas y probadas.
- **Alternativas:** (a) Estados 100 % configurables con transiciones en BD (motor de workflow) — fuera del alcance y arriesgado; (b) `ENUM` en BD sin administración — incumple el enunciado.
- **Consecuencias:** (+) cumple el requisito sin sacrificar integridad; la UI muestra nombres/colores configurables; (−) añadir un estado nuevo requiere código y migración (comportamiento deliberadamente controlado).

## ADR-010 — Fuente única de verdad por tema

- **Estado:** Aceptada · **Fecha:** 2026-10-03
- **Contexto:** La versión 1.0 repetía arquitectura, esquema y calendario en varios documentos, y se encontraron **24 contradicciones o vacíos** (ver tabla al final). El riesgo R3 del proyecto es la deriva documental.
- **Decisión:** Cada tema vive en **un solo documento** y los demás lo **enlazan** (tabla en [SRS §1.2](../01-definicion/especificaciones-tecnicas.md#12-qué-contiene-y-qué-no-contiene)). Los escenarios BDD detallados residen solo en `specs/`; el DDL solo en `database/migrations/`; los contratos solo en `docs/02-diseno/api-rest.md`. Los PR que tocan un tema actualizan su fuente y **no** copian el contenido.
- **Consecuencias:** (+) cada cambio se hace una vez; (−) el lector debe seguir enlaces. Se compensa con índices y matriz de trazabilidad.

## ADR-011 — Código de solicitud correlativo generado en base de datos

- **Estado:** Aceptada · **Fecha:** 2026-10-03
- **Contexto:** Formato exigido: `SOL-AAAA-NNNN`. Los `specs` usaban `REQ-…` y un ejemplo `REQ-2026-150` derivado del `id` (sin relleno). Generar el correlativo con `MAX(codigo)+1` produce duplicados bajo concurrencia.
- **Decisión:** Prefijo único **`SOL`**. El correlativo se toma de `secuencias_solicitud(anio)` con `SELECT … FOR UPDATE` dentro de la transacción de alta (RN-01). Relleno de ceros a 4 dígitos.
- **Alternativas:** `AUTO_INCREMENT` del `id` (huecos si hay *rollback*, no reinicia por año); UUID (no legible para personas).
- **Consecuencias:** (+) sin duplicados ni saltos por concurrencia; códigos legibles; (−) una fila bloqueada brevemente por alta (despreciable a esta escala).

## ADR-012 — Errores con RFC 7807

- **Estado:** Aceptada · **Fecha:** 2026-10-03
- **Contexto:** `arquitectura-tecnica.md` 1.0 proponía RFC 7807; `specs/01` proponía un JSON propio (`timestamp/status/error/message/errores`).
- **Decisión:** Un único formato: **RFC 7807** (`application/problem+json`, soportado de forma nativa por Spring 6 con `ProblemDetail`) más las extensiones `traceId`, `timestamp` y `errores`.
- **Consecuencias:** (+) estándar reconocido y consistente; incluye el `traceId` que exige el escenario de trazabilidad; (−) el frontend debe leer `detail` y `errores` (se centraliza en `apiClient`).

## ADR-013 — Migraciones con Flyway y `ddl-auto=validate`

- **Estado:** Aceptada · **Fecha:** 2026-10-03
- **Contexto:** El `spec` de autenticación sugería "arrancar y comprobar que Hibernate genere la tabla", lo que contradice el diseño con constraints, triggers y datos maestros.
- **Decisión:** El esquema se crea **solo con Flyway** (`database/migrations/V*.sql`). Hibernate usa `ddl-auto=validate`; nunca `create` ni `update`.
- **Consecuencias:** (+) esquema reproducible y versionado, idéntico en todos los ambientes; los triggers y CHECK existen; (−) cada cambio de entidad requiere su migración.

## ADR-014 — Baja lógica generalizada e historial inmutable

- **Estado:** Aceptada · **Fecha:** 2026-10-03
- **Contexto:** La versión 1.0 mezclaba `ON DELETE CASCADE` en historial/evidencias/comentarios con la regla de "no borrar" y con la promesa de "historial inmutable".
- **Decisión:** No hay borrados físicos de datos de negocio. Catálogos y usuarios usan `activo`; las solicitudes nunca se eliminan (no se borran); se quita `ON DELETE CASCADE`; `historial_solicitudes` tiene *triggers* que impiden `UPDATE`/`DELETE`.
- **Consecuencias:** (+) auditoría confiable; integridad referencial real; (−) las tablas crecen; se gestiona con archivado futuro, no con borrado.

---

## Registro de conflictos resueltos (versión 1.0 → 2.0)

Todas las contradicciones detectadas al analizar la documentación inicial y la decisión adoptada. **Valor vigente = columna "Decisión".**

| # | Tema | Versiones en conflicto | Decisión | ADR / RN |
|:-:|:---|:---|:---|:---|
| 1 | Código de ticket | `SOL-2026-0001` vs `REQ-2026-0001` / `REQ-2026-150` | `SOL-AAAA-NNNN` con relleno | ADR-011, RN-01 |
| 2 | Nombre del rol admin | `ADMIN` vs `ADMINISTRADOR` | `ADMIN` en API/BD (`ROLE_ADMIN`); "Administrador" en la UI | SRS §1.3 |
| 3 | Coste BCrypt | 12 vs 10 | **12** | RNF-01 |
| 4 | Tamaño máximo de archivo | 10 MB vs 5 MB | **5 MB**, máx. 3 por acción | RN-15 |
| 5 | Longitud mínima de descripción | 15 vs 10 | **15–500** | API §3.2 |
| 6 | Almacenamiento del token | "en memoria" vs `localStorage` | `localStorage` con riesgo documentado y mitigado | ADR-004 |
| 7 | Clave de `localStorage` | `gestion_univ_token` vs `gestion_univ_auth` | `gestion_univ_auth` (token + perfil) | ADR-004 |
| 8 | Respuesta de login | `{token, rol, nombre}` vs `{token, usuario:{…}}` | `{token, tipo, expiraEn, usuario:{…}}` | API §3.1 |
| 9 | Esquema de BD | 9 tablas con `id/password_hash/id_rol…` vs planes con `id_usuario/password/rol…` | Esquema único en `database/migrations` | ADR-010, ADR-013 |
| 10 | Asignación desde `REGISTRADA` | Diagrama: solo desde `EN_EVALUACION`; spec/HU: también desde `REGISTRADA` | Atajo con historial doble | ADR-003 |
| 11 | Endpoint de inicio de atención | `/iniciar-atencion` vs `/iniciar` | `PUT …/iniciar-atencion` | API §3.2 |
| 12 | Endpoints de dashboard | `/dashboard/metrics` vs `/kpis` + `/graficos/categorias` | `/dashboard/kpis` y `/dashboard/por-*` | API §3.4 |
| 13 | Formato de error | RFC 7807 vs JSON propio | RFC 7807 | ADR-012 |
| 14 | XSS en entradas | "Sanitizar" vs "rechazar con 400" | **Rechazar** con 400 | ADR-005, RN-18 |
| 15 | Carga de prueba | 50/100/500 VU vs 100/500/1000; RNF-02 con 50 | Escalonado 50 → 100 → 300 → 500 VU; RNF-02 se mide a 50 VU | [Pruebas §8](../03-calidad-y-operacion/estrategia-pruebas.md#8-pruebas-de-carga-y-estrés) |
| 16 | Quién ve el dashboard | Técnico con KPIs propios vs solo supervisor/admin | Técnico ve **sus** KPIs | API §3.4, RN-16 |
| 17 | Archivo del registro de IA | `docs/04-gestion/ia-register.md` vs `docs/REGISTRO_IA.md` | `docs/04-gestion/ia-register.md` (reglas) + un archivo por rol en `docs/04-gestion/ia-registro/` (bitácora, para evitar conflictos de _merge_) | [Registro de IA](../04-gestion/ia-register.md) |
| 18 | Evidencia de solución | Obligatoria (arquitectura) vs solo informe (spec 03) | **Informe + ≥ 1 evidencia** | RN-12 |
| 19 | Descripción de "pendientes" en dashboard | JPQL incluía `RECHAZADA`/`CANCELADA` como pendientes | Definición explícita de 4 estados | RN-11 |
| 20 | Semanas del proyecto | "16 semanas" desde el 5/10 pero hito en "semana 10" el 31/10 | 16 semanas = ciclo del curso (24/08–12/12); el proyecto se ejecuta desde la semana 7. **Actualización 03/10:** el curso fijó solo dos presentaciones (17/10 y 14/11) | [Calendario §1](../04-gestion/calendario-y-contingencia.md#1-calendario-y-hitos) |
| 21 | Estados administrables | Enunciado: administrar estados; spec 05: ENUM fijo | Catálogo con presentación editable | ADR-009 |
| 22 | Prioridades administrables | RF-09: CRUD con SLA; spec 05: "opcional, puede ser Enum" | CRUD con SLA y baja lógica | RF-09 |
| 23 | Registro de usuario vs esquema | `codigo_institucional` obligatorio en BD, ausente en el DTO | Se solicita en el registro | RF-02 |
| 24 | Redirección tras login | Todos a `/dashboard`, pero el estudiante no lo tiene | Redirección por rol (estudiante → "Mis solicitudes") | [UX §4](../01-definicion/ux-ui-prototipo.md#4-mapa-de-navegación-y-flujos) |
