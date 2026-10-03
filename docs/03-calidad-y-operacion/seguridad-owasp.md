# Seguridad Aplicativa y OWASP

> **Objetivo:** que la aplicación valide todas las entradas, no tenga secretos en el código, aplique autenticación y autorización correctas y sea verificable con pruebas de seguridad (SAST y DAST). Cubre OE-5 y los requisitos de seguridad de las Fases III y IV.
> Relacionados: [Arquitectura §9](../02-diseno/arquitectura-tecnica.md#9-seguridad-resumen) · [API REST §5](../02-diseno/api-rest.md#5-seguridad-de-la-api-resumen) · [Estrategia de pruebas](estrategia-pruebas.md) · [DevOps](devops-despliegue.md) · [ADR-004](../02-diseno/decisiones-arquitectura.md#adr-004--jwt-de-8-horas-sin-refresh-token) · [ADR-005](../02-diseno/decisiones-arquitectura.md#adr-005--rechazar-html-en-lugar-de-sanitizarlo)

---

## 1. Principios

1. **Defensa en profundidad:** ninguna protección depende de una sola capa (Nginx → filtros → `@PreAuthorize` → `AccessPolicy` → restricciones de BD).
2. **Denegar por defecto:** todo endpoint requiere autenticación salvo una lista blanca explícita ([API §4](../02-diseno/api-rest.md#4-matriz-de-autorización-por-endpoint)).
3. **Mínimo privilegio:** roles estrictos; el usuario de BD de la aplicación solo tiene permisos DML sobre su esquema (no `DROP`, no `GRANT`); el contenedor corre sin `root`.
4. **El cliente no es de confianza:** toda validación del frontend se repite en el backend.
5. **Fallar de forma segura y silenciosa:** los errores no revelan detalles internos (stacktrace, SQL, rutas); el detalle va a los logs con `traceId`.
6. **Secretos fuera del código:** variables de entorno / *secrets* del CI; jamás en el repositorio ni en prompts de IA.

---

## 2. Activos, actores y superficie de ataque

| Activo | Sensibilidad | Amenazas principales |
|:---|:---:|:---|
| Credenciales (hash BCrypt) y JWT | Alta | Fuerza bruta, robo de token, enumeración de usuarios |
| Datos personales (nombre, correo, código, teléfono) | Media | Acceso no autorizado, fuga por logs/errores |
| Solicitudes y evidencias | Media | IDOR (ver solicitudes ajenas), archivos maliciosos |
| Integridad del flujo de estados | Alta | Transiciones no autorizadas, saltarse la máquina de estados |
| Disponibilidad del servicio | Media | DoS por carga, subidas masivas |
| Secretos de infraestructura | Alta | Fuga por repositorio, imágenes o logs |

| Actor de amenaza | Capacidad | Ejemplo |
|:---|:---|:---|
| Anónimo en Internet | Alcanza login y registro | Fuerza bruta; registro masivo |
| Estudiante malicioso | Autenticado con rol mínimo | Cambiar `{id}` para ver tickets ajenos; subir ejecutable; auto-promoverse a admin |
| Técnico/supervisor curioso | Rol intermedio | Ver tickets de otra área; saltar transiciones |
| Dependencia comprometida | Código de terceros | Librería con CVE |

**Superficies:** formularios (texto libre), subida de archivos, parámetros de ruta/consulta, cabecera `Authorization`, endpoints públicos, dependencias, imágenes Docker, pipeline CI/CD.

---

## 3. Matriz OWASP Top 10 (2021)

| Riesgo | Cómo podría ocurrir aquí | Controles implementados | Dónde | Verificación |
|:---|:---|:---|:---|:---|
| **A01 Broken Access Control** | Estudiante accede a `/solicitudes/{id}` ajena (IDOR); técnico resuelve una solicitud no asignada; estudiante llama a `/admin/usuarios`; auto-asignarse rol admin en el registro | Autorización en 3 niveles; `AccessPolicy` central (RN-16) con respuesta **404** para recursos fuera de alcance; el registro **ignora/rechaza** el campo `rol` (RN-04); `solicitante` siempre sale del JWT; `accionesPermitidas` calculado en servidor | [API §4](../02-diseno/api-rest.md#4-matriz-de-autorización-por-endpoint), RN-04/07/16 | Suite de autorización: cada endpoint × cada rol × recurso propio/ajeno (§10.1); ZAP |
| **A02 Cryptographic Failures** | Contraseñas débiles o en claro; JWT con secreto corto; tráfico sin cifrar | BCrypt coste 12; JWT HS256 con secreto ≥ 256 bits desde entorno (la app **no arranca** si falta o es corto); TLS 1.2+ con HSTS | §5, §6 | Test de arranque sin `JWT_SECRET`; revisión de BD; `testssl`/ZAP |
| **A03 Injection** | SQL injection; XSS almacenado en título/descripción/comentarios; inyección en nombre de archivo | JPA/JPQL **parametrizado** (prohibido concatenar SQL); `@SinHtml` rechaza etiquetas (RN-18); React escapa al renderizar; **prohibido** `dangerouslySetInnerHTML`; nombres de archivo generados por el servidor | [ADR-005](../02-diseno/decisiones-arquitectura.md#adr-005--rechazar-html-en-lugar-de-sanitizarlo), §8 | Pruebas con *payloads* (`' OR 1=1--`, `<script>alert(1)</script>`) → 400; CodeQL; ZAP |
| **A04 Insecure Design** | Saltarse la máquina de estados; códigos de solicitud duplicados | Máquina de estados declarativa en servidor (409); secuencia anual con incremento atómico y `UNIQUE(codigo)`; historial inmutable; reglas RN documentadas **antes** de codificar; modelado de amenazas (§2) | Arquitectura §2, RN-06/17 | Pruebas de las transiciones válidas y las inválidas más comunes |
| **A05 Security Misconfiguration** | Swagger/Actuator expuestos; CORS `*`; mensajes de error con stacktrace; contraseñas por defecto de MySQL | Perfil `prod` desactiva Swagger y detalle de errores; Actuator solo `health` público y `prometheus` en red interna; CORS por `ALLOWED_ORIGINS`; cabeceras de §7; imágenes mínimas y sin `root`; `.env` fuera del repo | §6, §7, [DevOps](devops-despliegue.md) | Checklist de hardening (§10.3); ZAP baseline |
| **A06 Vulnerable & Outdated Components** | Dependencia con CVE (Spring, Jackson, npm) | Dependabot semanal (alertas y PRs de actualización); imágenes base con versión fijada | §9 | Alertas y PRs de Dependabot |
| **A07 Identification & Authentication Failures** | Fuerza bruta; enumeración de cuentas; contraseñas débiles; tokens que no expiran | *Rate limit* en Nginx; **mismo mensaje** para correo inexistente/clave errónea/cuenta inactiva; política RN-03; JWT 8 h; verificación de usuario activo en cada petición (RN-22) | §5 | Tests de mensaje uniforme y expiración |
| **A08 Software & Data Integrity Failures** | Pipeline manipulado; dependencias no verificadas; deserialización insegura | Acciones de GitHub fijadas por versión/SHA; protección de `main` y revisión obligatoria; deserialización solo a `record` DTO tipados; imágenes construidas en CI y publicadas con *tag* inmutable | [Gobernanza](../04-gestion/equipo-y-flujo-de-trabajo.md), [DevOps](devops-despliegue.md) | Revisión de PR; branch protection |
| **A09 Security Logging & Monitoring Failures** | Ataque sin dejar rastro; logs con contraseñas | Log de eventos de seguridad (login fallido, 403, 409 de transición, cambios de rol/contraseña) con `traceId`; **nunca** se registran contraseñas, tokens ni cuerpos completos | [Observabilidad §3 y §6](observabilidad.md) | Revisión de logs; simulacro de incidente |
| **A10 Server-Side Request Forgery** | Hoy el backend no realiza peticiones a URLs provistas por el usuario | Riesgo **no aplicable** mientras no se agreguen *webhooks* o descarga de URLs; si se añaden (evolución), se usará lista blanca de destinos | [API §8](../02-diseno/api-rest.md#8-panorama-de-estilos-de-api-y-api-gateway) | Revisión en diseño de nuevas funciones |

### 3.1 OWASP API Security Top 10 — puntos clave

| Riesgo de API | Control |
|:---|:---|
| API1 Broken **Object Level** Authorization | `AccessPolicy` en todos los accesos por `{id}` (RN-16) |
| API2 Broken Authentication | §5 |
| API3 Broken Object **Property** Level Authorization / Excessive Data Exposure | DTO `record` explícitos; sin `passwordHash`; `privado` solo para roles internos |
| API4 Unrestricted Resource Consumption | Paginación obligatoria (máx. 100), límite de cuerpo/archivos, *rate limit* |
| API5 Broken **Function** Level Authorization | `@PreAuthorize` por endpoint + prueba de la matriz |
| API6 Unrestricted Access to Sensitive Business Flows | Registro con *rate limit*; transiciones solo válidas |
| API8 Security Misconfiguration | §7 |
| API9 Improper Inventory Management | OpenAPI como inventario; Swagger fuera de producción |

---

## 4. Seguridad en la subida de archivos (evidencias)

Es la superficie con mayor riesgo de la aplicación (riesgo R5).

| Control | Detalle |
|:---|:---|
| Lista blanca de tipos | Solo JPG, PNG, PDF (RN-15). Se rechaza `.exe`, `.svg`, `.html`, `.js`, etc. |
| Validación **por contenido** | Se comprueban los *magic bytes* (JPG `FF D8 FF`, PNG `89 50 4E 47`, PDF `25 50 44 46`) y que coincidan con la extensión y el `Content-Type`. No se confía en el nombre ni en el tipo declarado. |
| Tamaño y cantidad | ≤ 5 MB por archivo, ≤ 3 por acción (413 si se excede); límites también en Nginx (`client_max_body_size 16m`) y Spring (`spring.servlet.multipart.max-file-size`). |
| Nombre y ruta | Nombre almacenado = UUID generado por el servidor; la ruta nunca incluye texto del usuario → sin *path traversal* (`../`). |
| Ubicación | Volumen fuera del *webroot*; el binario no se ejecuta ni se sirve estáticamente. |
| Entrega | Solo por endpoint autenticado con control de alcance; `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`. |
| Atomicidad | Si falla la transacción se borra el archivo; si falla un archivo no se crea la solicitud (nada parcial). |
| Antimalware | **No implementado** (fuera de alcance). Riesgo aceptado y documentado; evolución: escaneo con ClamAV al subir. |
| Metadatos | PDF/imagen se sirven tal cual; no se procesan en el servidor (reduce superficie de *parsers*). |

---

## 5. Autenticación y gestión de sesión

| Aspecto | Implementación |
|:---|:---|
| Hash de contraseña | `BCryptPasswordEncoder(12)`. Nunca se registra ni se devuelve. |
| Política | RN-03: ≥ 8 caracteres, 1 mayúscula, 1 número, distinta del correo. |
| Login | Mismo mensaje `Credenciales inválidas` (401) para: correo inexistente, clave incorrecta, cuenta inactiva (evita enumeración de cuentas). |
| JWT | HS256, 8 h, claims mínimos, `jti`; verificación de firma, expiración y usuario activo en cada petición (RN-22). Sin *refresh token* ([ADR-004](../02-diseno/decisiones-arquitectura.md#adr-004--jwt-de-8-horas-sin-refresh-token)). |
| Cambio de contraseña | Exige contraseña actual. |
| Recuperación | Token aleatorio criptográfico de 256 bits, enviado por correo; en BD solo su **SHA-256**; vigencia 30 min; un solo uso; invalida tokens previos; respuesta siempre 202 (no revela si el correo existe). |
| Rate limiting | Nginx `limit_req` en `/api/v1/auth/*` (ej. 10 req/min/IP, *burst* 5) → 429. |
| Registro | El rol no se acepta del cliente (RN-04); correo normalizado a minúsculas; dominio institucional (RN-02). |
| Almacenamiento en el cliente | `localStorage` con las mitigaciones del ADR-004 (CSP estricta, sin HTML dinámico). |

---

## 6. Gestión de secretos

### 6.1 Reglas

1. **Ningún secreto en el repositorio:** ni contraseñas de BD, ni `JWT_SECRET`, ni hashes de usuarios de demo. Esto incluye el historial de Git.
2. `application.yml` solo contiene **referencias** `${VARIABLE}`; si una variable obligatoria falta, la aplicación **falla al arrancar** con un mensaje claro.
3. El archivo `.env` está en `.gitignore`. En el repo solo existe **`.env.example`** con nombres de variables y valores de ejemplo **no reales**.
4. En CI/CD los secretos viven en **GitHub Secrets** (por *Environment*: `staging`, `production`) y nunca se imprimen en logs.
5. El frontend **no contiene secretos** (todo lo que va al navegador es público): solo `VITE_API_URL`.
6. Los usuarios de demostración se crean con `DemoDataSeeder` y contraseñas de variables de entorno, no con hashes en SQL.
7. **Rotación:** si un secreto se filtra, se rota de inmediato (no basta con borrar el commit) y se registra el incidente.

### 6.2 Detección y prevención

| Mecanismo | Cuándo |
|:---|:---|
| `gitleaks` como *pre-commit* y job de CI | En cada commit/PR; bloquea el merge si encuentra secretos |
| Revisión de PR (checklist) | "No se comitearon credenciales ni `.env`" ([plantilla de PR](../../.github/pull_request_template.md)) |
| Auditoría final | Búsqueda de `password`, `secret`, `token`, `jdbc:mysql://` con credenciales en el árbol y en el historial antes del release |

### 6.3 Inventario de secretos y variables

Ver tabla completa en [DevOps §5](devops-despliegue.md#5-variables-de-entorno). Secretos: `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `JWT_SECRET`, `GRAFANA_ADMIN_PASSWORD`, `DEMO_USER_PASSWORD`.

---

## 7. Cabeceras de seguridad, TLS y CORS

Configuradas en Nginx (y verificadas por ZAP):

| Cabecera | Valor |
|:---|:---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` (sin `unsafe-inline` ni `unsafe-eval`; verificar que Recharts y los estilos funcionen y ajustar de forma mínima) |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Cache-Control` (API) | `no-store` en respuestas autenticadas |
| `Server` / versión | Ocultar versión de Nginx (`server_tokens off`) |

- **TLS:** solo TLS 1.2/1.3; redirección 80→443.
- **CORS:** `ALLOWED_ORIGINS` explícita (nunca `*`), métodos y cabeceras mínimos. Con Nginx sirviendo SPA y API bajo el mismo origen, CORS solo se necesita en desarrollo.
- **CSRF:** deshabilitado en Spring porque la autenticación es por cabecera `Authorization` (no por cookie) y el backend es *stateless*; se documenta para que no se interprete como omisión. Si se migra a cookie (ADR-004), se activa.

---

## 8. Validación de entradas

| Capa | Qué valida |
|:---|:---|
| Frontend (Zod) | Experiencia de usuario: formato, longitudes, tamaño/tipo de archivo. **No es un control de seguridad.** |
| Controller (`@Valid`) | Obligatoriedad, longitudes, patrones (`@Pattern`), `@Email`, rangos (`@Min/@Max`), `@SinHtml`. |
| Servicio | Reglas de negocio: dominio del correo, técnico del área, transición permitida. |
| BD | `NOT NULL`, `UNIQUE`, `FOREIGN KEY`, `CHECK`. |

Reglas transversales: rechazar campos desconocidos en el JSON de registro (`FAIL_ON_UNKNOWN_PROPERTIES` → impide inyectar `rol`); paginación con tope; parámetros de ordenamiento contra **lista blanca** de columnas (evita inyección en `sort`); IDs numéricos tipados.

---

## 9. Cadena de suministro y dependencias

| Medida | Herramienta | Frecuencia |
|:---|:---|:---|
| Actualizaciones automáticas | Dependabot (Maven, npm, GitHub Actions, Docker) | Semanal |
| Imágenes base | Versiones fijas (`eclipse-temurin:17-jre`, `nginx:stable-alpine`, `mysql:8.0`) | Cada *build* |
| Bloqueo de versiones | `package-lock.json` versionado; `npm ci` en CI | Siempre |
| Acciones de CI | Fijadas por versión mayor/SHA | Siempre |

---

## 10. Verificación de seguridad

### 10.1 Pruebas de autorización (obligatorias)

Una prueba parametrizada recorre la [matriz de autorización](../02-diseno/api-rest.md#4-matriz-de-autorización-por-endpoint): para cada endpoint y rol comprueba **200/201/204** si procede o **403/404** si no, incluyendo recurso propio vs ajeno. Es la defensa principal contra A01.

### 10.2 SAST y DAST

| Tipo | Herramienta | Cuándo | Criterio de aprobación |
|:---|:---|:---|:---|
| **SAST** | CodeQL (Java, JS) + gitleaks | Cada PR a `develop`/`main` | 0 hallazgos **altos/críticos** sin justificar |
| **DAST (baseline)** | OWASP ZAP baseline contra *staging* | Cada despliegue a *staging* | 0 alertas de nivel Alto; Medios triados |
| **Secretos** | gitleaks | Cada commit/PR | 0 hallazgos |
| **Pruebas manuales** | Lista de *payloads* (SQLi, XSS, IDOR, subida de archivos, fuerza bruta) | Sprint 4–5 | Todos bloqueados; evidencia en el informe |

Resultados y su triaje se documentan en el informe de pruebas ([Estrategia §9](estrategia-pruebas.md#9-pruebas-de-seguridad)).

### 10.3 Checklist de hardening previo al release

- [ ] `prod` desactiva Swagger, `/v3/api-docs` y detalle de errores.
- [ ] `/actuator/prometheus` no es accesible desde Internet (verificado desde fuera).
- [ ] CORS limitado al dominio real; sin `*`.
- [ ] Cabeceras de §7 presentes (verificadas con ZAP/`curl -I`).
- [ ] TLS válido; HTTP redirige a HTTPS.
- [ ] Usuario de BD de la aplicación **sin** privilegios DDL en `prod` (migraciones con usuario separado).
- [ ] Contenedores sin `root`; sin puertos de BD publicados al exterior.
- [ ] `gitleaks` limpio sobre **todo el historial**.
- [ ] Contraseñas por defecto cambiadas (MySQL, Grafana).
- [ ] Usuarios de demo con contraseñas fuertes o desactivados tras la sustentación.

---

## 11. Seguridad en el uso de IA

- **Nunca** pegar en un prompt: contraseñas, `JWT_SECRET`, tokens, cadenas de conexión reales ni datos personales reales ([Registro de IA §3](../04-gestion/ia-register.md)).
- El código generado por IA se trata como **código de un tercero no confiable**: revisión línea a línea, pruebas y pasada de SAST antes del PR. Es una fuente frecuente de *hardcode*, validaciones ausentes y dependencias inventadas.
- Verificar que las dependencias sugeridas **existen** y son las oficiales (riesgo de *package hallucination*/*typosquatting*).

---

## 12. Respuesta ante incidentes de seguridad

| Paso | Acción |
|:---|:---|
| Detectar | Alertas por picos de 401/403/429, intentos de acceso a rutas inexistentes, fallos de `gitleaks`. |
| Contener | Desactivar cuenta(s) afectada(s); rotar `JWT_SECRET` (invalida **todos** los tokens); bloquear IP en Nginx. |
| Erradicar | Corregir la causa (parche, regla); rotar cualquier secreto expuesto. |
| Recuperar | Recrear los datos con el *seed* si hubo alteración; verificar integridad del historial. |
| Aprender | Informe *post-mortem* sin culpables, acciones correctivas en el backlog. |

Procedimiento operativo y plantilla en [Observabilidad §7](observabilidad.md#7-gestión-de-incidentes).
