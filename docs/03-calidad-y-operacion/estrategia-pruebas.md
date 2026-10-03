# Estrategia de Pruebas y Calidad

> **Objetivo (TS-06, TS-07, TS-08, OE-7):** tener confianza demostrable de que el sistema cumple sus criterios de aceptación, es seguro y soporta la carga prevista, con pruebas **automatizadas** ejecutadas en cada cambio y un **informe de pruebas** final.
> Relacionados: [SRS (RNF y trazabilidad)](../01-definicion/especificaciones-tecnicas.md) · [API REST](../02-diseno/api-rest.md) · [Seguridad](seguridad-owasp.md) · [Observabilidad](observabilidad.md) · [DevOps §4](devops-despliegue.md#4-pipeline-cicd-github-actions) · [ADR-008](../02-diseno/decisiones-arquitectura.md#adr-008--herramientas-de-prueba-y-seguridad-automatizada)

---

## 1. Principios

1. **Los criterios de aceptación son el contrato.** Cada escenario `CA-n` de un `spec` debe tener al menos una prueba (automática o, si no es viable, un caso manual documentado). El nombre de la prueba cita el escenario: `@DisplayName("[US-10 CA-1] Técnico resuelve con informe y evidencia")`.
2. **Pirámide de pruebas:** muchas unitarias rápidas, un número moderado de integración, pocas pruebas de extremo a extremo.
3. **Probar contra la realidad:** integración con **MySQL 8 real (Testcontainers)**, no H2, porque el esquema usa triggers, `CHECK` y funciones propias de MySQL.
4. **Las pruebas de seguridad y autorización son de primera clase**, no un añadido final.
5. **Se prueba el camino triste:** por cada caso feliz, al menos un caso de error/borde.
6. **Determinismo:** sin dependencias de hora real, orden o red externa (se inyecta un `Clock`).
7. **Pruebas generadas con IA se revisan** igual que el código de producción ([§10](#10-pruebas-con-apoyo-de-ia)).

---

## 2. Niveles de prueba

| Nivel | Qué prueba | Herramientas | Quién | Cuándo corre | Cobertura / meta |
|:---|:---|:---|:---:|:---|:---|
| **Unitaria backend** | Servicios, workflow, validadores, mapeos | JUnit 5, Mockito, AssertJ | Autor de la clase | Cada commit/PR | ≥ 70 % de líneas en total |
| **Unitaria frontend** | Componentes, hooks, esquemas Zod, utilidades | Vitest + React Testing Library | Autor del componente | Cada PR | Componentes de formularios y `AuthContext` críticos |
| **Integración persistencia** | Repositorios, consultas del dashboard y constraints | `@DataJpaTest`/`@SpringBootTest` + Testcontainers MySQL + Flyway | Rol 3 / Rol 6 | Cada PR | Todas las `@Query` |
| **Integración web** | Controladores + seguridad + validación + manejo de errores | `MockMvc` / `@WebMvcTest`, `@SpringBootTest` | Rol 2 / Rol 6 | Cada PR | Todos los endpoints |
| **Autorización** | Matriz rol × endpoint × recurso propio/ajeno | JUnit parametrizado | Rol 6 | Cada PR | 100 % de la [matriz](../02-diseno/api-rest.md#4-matriz-de-autorización-por-endpoint) |
| **API (caja negra)** | Flujos HTTP completos | RestAssured / colección **Bruno** en `api-tests/` | Rol 6 | PR y tras desplegar a *staging* | Flujos de cada HU |
| **Aceptación (BDD)** | Escenarios Gherkin de `specs/` | Trazabilidad CA→test; UAT manual | Todos | Fin de cada sprint | 100 % de escenarios *Must* |
| **Extremo a extremo (E2E)** | Recorridos de usuario en navegador | Playwright (opcional) o guion manual | Rol 6 | Antes de cada hito | Flujo MVP y flujo completo |
| **Usabilidad / usuario** | Tareas reales con usuarios | Protocolo de [UX §7](../01-definicion/ux-ui-prototipo.md#7-evaluación-de-usabilidad) | Roles 4 y 5 | Antes del RC | SUS ≥ 70 |
| **Seguridad** | SAST, DAST, dependencias, secretos, *payloads* | CodeQL, ZAP, gitleaks, Dependabot | Rol 6 | PR / *staging* / pre-release | Sin hallazgos altos |
| **Carga y estrés** | Rendimiento y límites | k6 | Rol 6 | Fase III–IV | Umbrales de [§8](#8-pruebas-de-carga-y-estrés) |
| **Observabilidad** | `traceId`, métricas, alertas | Pruebas de integración + simulacro | Rol 6 | Fase IV | [Criterios](observabilidad.md#11-criterios-de-aceptación-de-observabilidad) |

---

## 3. Ambientes y datos de prueba

| Tipo | Estrategia |
|:---|:---|
| **Unitarias** | Mocks; sin BD ni red. `Clock` fijo. |
| **Integración** | Contenedor MySQL 8 efímero por ejecución (Testcontainers) con las migraciones reales (`V1`, `V2`). |
| **Datos** | *Builders* de prueba (`UsuarioTestBuilder`, `SolicitudTestBuilder`) para crear estados concretos sin repetir código. Prohibido depender de datos de otra prueba. |
| **Staging** | `DemoDataSeeder` con usuarios de los 4 roles y ~200 solicitudes variadas (estados, prioridades, fechas) para dashboard y UAT. |
| **Carga** | Semilla de **~2 000 solicitudes** y usuarios sintéticos para medir el dashboard (RNF-12). |
| **Privacidad** | Solo datos ficticios; nunca datos personales reales. |

Usuarios de prueba estándar (credenciales de `DEMO_USER_PASSWORD`): `admin@`, `supervisor.ti@`, `tecnico.ti@`, `tecnico.mant@`, `estudiante1@…`, `estudiante2@…` (dominio `ALLOWED_EMAIL_DOMAIN`).

---

## 4. Pruebas unitarias

### 4.1 Backend

Qué debe cubrirse como mínimo (ver también el [catálogo §14](#14-catálogo-de-casos-de-prueba-prioritarios)):

| Clase | Casos obligatorios |
|:---|:---|
| `SolicitudWorkflowService` | **Cada** transición válida (T1–T10) y **cada** combinación inválida → `TransicionInvalidaException`; permisos por rol/propiedad; historial escrito en la misma operación; atajo desde `REGISTRADA` registra **dos** filas ([ADR-003](../02-diseno/decisiones-arquitectura.md#adr-003--atajo-de-asignación-desde-registrada)) |
| `SolicitudService` | Cálculo de `fecha_limite_sla = MIN(prioridad, categoría)` (RN-09); recálculo al cambiar prioridad; validación de categoría/prioridad activas |
| `CodigoSolicitudService` | Formato `SOL-AAAA-NNNN`; cambio de año reinicia; desborde > 9999 |
| `AuthService` | Login ok; correo inexistente = mismo error que clave errónea; rol forzado `ESTUDIANTE` |
| `PasswordResetService` | Token de un solo uso; expiración 30 min; invalida anteriores; no revela existencia |
| `FileTypeValidator` / `FileStorageService` | Acepta JPG/PNG/PDF reales; rechaza `.exe` renombrado a `.jpg` (firma distinta); rechaza > 5 MB; nombre aleatorio; limpieza ante fallo |
| `DashboardService` | Filtro por rol (admin/supervisor/técnico); definiciones de RN-11 |
| Validadores (`@SinHtml`, `@PasswordSegura`, `@DominioInstitucional`) | Tablas de valores válidos e inválidos (incluye *payloads* XSS) |
| `AccessPolicy` | Todas las reglas RN-16 y RN-19 |

Convenciones: patrón *Given-When-Then* en el cuerpo; un concepto por prueba; `@ParameterizedTest` para tablas; nombres en español descriptivos.

### 4.2 Frontend

| Elemento | Casos |
|:---|:---|
| Esquemas Zod (`LoginSchema`, `RegisterSchema`, `SolicitudSchema`) | Valores válidos/inválidos; dominio del correo; contraseña; tamaño y tipo de archivo |
| `LoginPage`, `RegisterPage`, `NuevaSolicitudPage` | Botón deshabilitado con errores o en carga; muestra mensajes por campo; muestra error del backend; no envía con datos inválidos |
| `FileUploader` | Rechaza > 5 MB y tipos no permitidos; vista previa; límite de 3 archivos |
| `AuthContext` / `apiClient` | Restaura sesión desde `localStorage`; interceptor añade `Bearer`; ante 401 limpia sesión y redirige a `/login` |
| `ProtectedRoute` / `RoleRoute` | Redirige sin sesión; bloquea rol no permitido |
| Botones por `accionesPermitidas` | Muestra solo las acciones que el backend declara permitidas |
| `EstadoBadge`, `KpiCard` | Renderizan color/texto/valores con datos de ejemplo |

Se usa `vi.mock` para la capa `services/*` y *Mock Service Worker* (MSW) para simular la API con los contratos de [API REST](../02-diseno/api-rest.md).

---

## 5. Pruebas de integración

### 5.1 Persistencia (MySQL real)

- **Migraciones:** se aplican `V1` y `V2` sobre un contenedor vacío; Hibernate `validate` no falla.
- **Triggers:** `UPDATE` y `DELETE` sobre `historial_solicitudes` lanzan error (RN-17).
- **Constraints:** SLA ≤ 0, color hex inválido, correo duplicado, FK inexistente → violan restricción.
- **Dashboard (`DashboardRepositoryIT`):** con un conjunto de datos conocido verifican pendientes, atendidas, % resueltas, MTTR, vencidas, por categoría/prioridad/responsable (definiciones RN-11) y el aislamiento por área.
- **Transaccionalidad (RNF-04):** si falla el guardado del archivo o del historial, **no** queda solicitud huérfana (rollback completo).

### 5.2 Web (controladores + seguridad)

Para **cada** endpoint de [API REST §3](../02-diseno/api-rest.md#3-catálogo-de-endpoints):
- Camino feliz con el código HTTP documentado.
- Validación fallida → 400 con `errores` por campo y `traceId`.
- Sin token → 401; token expirado/manipulado → 401.
- Rol incorrecto → 403; recurso ajeno → 404.
- Transición inválida → 409.
- Archivo inválido → 413/415.
- Forma del error conforme a RFC 7807.

### 5.3 Pruebas de autorización (matriz)

Una prueba parametrizada genera el producto **endpoint × rol × (recurso propio / ajeno / inexistente)** y compara con la matriz esperada del documento de la API. Incluye específicamente:

| Caso de abuso | Resultado esperado |
|:---|:---|
| Estudiante A pide `GET /solicitudes/{id de B}` | 404 |
| Estudiante llama `PUT …/asignar` | 403 |
| Técnico resuelve una solicitud asignada a otro | 404 (fuera de alcance) / 403 según regla |
| Supervisor de TI asigna solicitud de Mantenimiento | 404 |
| Supervisor de TI asigna un técnico de Mantenimiento | 400/409 (RN-07) |
| Registro enviando `"rol":"ADMIN"` | 400 |
| Usuario desactivado con token aún vigente | 401 (RN-22) |
| Estudiante envía comentario `privado:true` | 403 |
| Último admin intenta desactivarse | 409 |

---

## 6. Pruebas de API

| Elemento | Detalle |
|:---|:---|
| **Colección** | Carpeta `api-tests/` con una colección **Bruno** (texto plano, versionable en Git). Entornos `dev`, `staging`. Autenticación por script que obtiene el JWT. |
| **Contenido** | Un flujo por historia: *registro → login → crear solicitud → asignar → iniciar → resolver → cerrar*, más casos negativos de la matriz de códigos HTTP. |
| **Automatización** | Se ejecuta en CI contra el backend levantado con Compose (`bru run --env ci`) y de nuevo tras cada despliegue a *staging* como *smoke test*. |
| **Contrato** | Se compara `/v3/api-docs` generado con `openapi.yaml` versionado; un cambio no declarado rompe el *build* ([API §9](../02-diseno/api-rest.md#9-evolución-y-compatibilidad)). |
| **Evidencia** | Reporte HTML de la ejecución adjunto al informe de pruebas y a cada PR relevante. |

---

## 7. Pruebas funcionales, de aceptación y de usuario

### 7.1 Trazabilidad de criterios de aceptación (BDD)

| Spec | Escenarios | Pruebas que los cubren |
|:---|:---:|:---|
| 01 Autenticación | ver spec | `AuthServiceTest`, `AuthControllerTest`, colección Bruno, UAT-01 |
| 02 Registro | ver spec | `SolicitudServiceTest`, `FileStorageServiceTest`, `NuevaSolicitudPage.test`, colección Bruno |
| 03 Gestión | ver spec | `SolicitudWorkflowServiceTest`, `AutorizacionMatrizTest`, `HistorialInmutableIT` |
| 04 Dashboard | ver spec | `DashboardRepositoryIT`, `DashboardControllerTest` |
| 05 Administración | ver spec | `CatalogoServiceTest`, `AdminUsuariosControllerTest` |
| 06/07/08 Técnicos | ver spec | CI, ZAP, k6, revisión de entregables |

La **tabla de trazabilidad completa CA → prueba** se mantiene en cada `specs/NN/03-tasks.md` (columna "Prueba") y se consolida en el informe de pruebas.

### 7.2 Pruebas de aceptación de usuario (UAT)

Sesiones guiadas en *staging* donde un integrante **que no desarrolló** la funcionalidad ejecuta el guion y registra *Aprobado / Fallido / Bloqueado*.

| ID | Guion (rol) | Resultado esperado |
|:---|:---|:---|
| UAT-01 | Estudiante se registra, inicia sesión y ve "Mis solicitudes" | Registro y sesión correctos; sin acceso a dashboard |
| UAT-02 | Estudiante crea solicitud con foto de 2 MB | Código `SOL-AAAA-NNNN` visible; estado *Registrada* |
| UAT-03 | Estudiante intenta subir `.exe` y una imagen de 10 MB | Bloqueado en cliente y servidor con mensaje claro |
| UAT-04 | Supervisor evalúa, cambia prioridad y asigna técnico del área | Estado *Asignada* |
| UAT-05 | Técnico inicia atención y resuelve con informe y foto | Estado *Resuelta* |
| UAT-06 | Estudiante cierra la solicitud resuelta | Estado *Cerrada*; aparece en el dashboard |
| UAT-09 | Administrador crea categoría y la ve un estudiante; la desactiva y desaparece | RF-09/RN-14 |
| UAT-10 | Supervisor revisa dashboard filtrado por fechas | Cifras coherentes con la bandeja; solo su área |

Cada UAT guarda capturas y se enlaza en el informe. Los fallos abren *issues* con etiqueta `bug`.

### 7.3 Pruebas con usuarios (usabilidad)

Protocolo, tareas, cuestionario SUS y criterios en [UX/UI §7](../01-definicion/ux-ui-prototipo.md#7-evaluación-de-usabilidad) (≥ 5 participantes ajenos al equipo).

---

## 8. Pruebas de carga y estrés

**Herramienta:** k6 (scripts en `tests/performance/`, umbrales como código, salida a Prometheus/Grafana). **Ambiente:** *staging* con recursos equivalentes a producción y **~2 000 solicitudes** sembradas.

### 8.1 Escenario de usuario virtual (VU)

1. `setup()`: login de N usuarios de prueba **una sola vez** y reutilización del token (el login con BCrypt coste 12 es intencionalmente costoso, ~200–300 ms de CPU; no debe dominar la medición).
2. Mezcla por iteración: **60 %** lectura (`mis-solicitudes`, detalle, catálogos) · **25 %** creación de solicitud (la mitad con evidencia de ~1 MB) · **10 %** bandeja/dashboard (usuarios supervisor/admin) · **5 %** transiciones.
3. *Think time* aleatorio de 1–3 s.

### 8.2 Perfiles de prueba

| Perfil | Carga (VU) | Duración | Objetivo | Umbral de aprobación |
|:---|:---:|:---:|:---|:---|
| **Carga nominal** | **50** | 10 min | Verificar **RNF-02** | `P95 ≤ 300 ms` (excepto login), `error < 1 %` |
| **Estrés** | hasta **500** | Rampa 10 min | Encontrar el punto de quiebre y observar la recuperación | Registrar VU donde P95 > 1 s o error > 5 %; el sistema **se recupera solo** al bajar la carga |

> **Nota:** se mantienen dos perfiles (carga nominal de 50 VU y estrés hasta 500 VU); RNF-02 se evalúa a **50 VU**.

### 8.3 Umbrales (k6)

```javascript
export const options = {
  thresholds: {
    'http_req_failed':                         ['rate<0.01'],
    'http_req_duration{endpoint:solicitudes}': ['p(95)<300'],
    'http_req_duration{endpoint:dashboard}':   ['p(95)<300'],
    'http_req_duration{endpoint:login}':       ['p(95)<800'],   // BCrypt 12: excepción justificada
  },
};
```

**Excepción documentada:** `POST /auth/login` tiene objetivo P95 ≤ 800 ms porque el coste de BCrypt es una **medida de seguridad** deliberada; relajarlo para cumplir 300 ms sería un error de diseño.

### 8.4 Qué se entrega

Para cada perfil: gráficos de latencia (P50/P95/P99), tasa de errores, throughput, uso de CPU/memoria/pool (dashboard de Grafana), cuellos de botella observados, conclusión y acciones. Va al **informe de pruebas** (§13).

---

## 9. Pruebas de seguridad

Alineadas con [Seguridad §10](seguridad-owasp.md#10-verificación-de-seguridad).

| Prueba | Herramienta | Alcance |
|:---|:---|:---|
| SAST | CodeQL (Java/JS) | Todo el código en cada PR |
| Dependencias | Dependabot | Semanal |
| Secretos | gitleaks | Cada commit y todo el historial antes del release |
| DAST baseline | OWASP ZAP | Cada despliegue a *staging* |
| Autorización | Suite §5.3 | Cada PR |
| *Payloads* manuales | SQLi (`' OR 1=1 --`), XSS (`<script>alert(1)</script>`, `<img onerror>`), *path traversal* en nombre de archivo, `.exe` renombrado, JWT manipulado/`alg:none`, IDOR, fuerza bruta de login | Sprint 4–5 |
| Configuración | Lista de [hardening](seguridad-owasp.md#103-checklist-de-hardening-previo-al-release) | Pre-release |

**Criterio de aceptación:** 0 hallazgos Altos/Críticos abiertos; los Medios triados con decisión (corregir/aceptar con justificación). El escenario BDD de DevOps "Prevención de inyecciones" (entrada con `<script>` → 400) se automatiza.

---

## 10. Pruebas con apoyo de IA

El enunciado pide **generación asistida por IA** y **revisión de las pruebas generadas**. Reglas:

### 10.1 Cómo se usa la IA

- Para **generar el esqueleto** de pruebas (casos de borde, tablas de valores, *builders*), proponer escenarios negativos y revisar la cobertura de un escenario BDD.
- Nunca para "hacer pasar" una prueba que falla modificando la aserción sin entender la causa.
- Toda interacción significativa se anota en el [Registro de IA](../04-gestion/ia-register.md) (herramienta, prompt, resultado, ¿se usó?, validación, modificaciones, responsable).

### 10.2 Lista de verificación de una prueba generada por IA

- [ ] **¿Verifica un comportamiento real?** (no una tautología ni `assertNotNull` solamente).
- [ ] Las aserciones comprueban **valores concretos** (estado, código HTTP, mensaje, filas en BD), no solo que "no lanza excepción".
- [ ] **Falla si se rompe el código:** se introduce un cambio deliberado (*mutación manual*) y la prueba debe ponerse en rojo.
- [ ] Cubre **casos de error y bordes** (vacío, longitud límite, rol incorrecto), no solo el camino feliz.
- [ ] Usa **datos y nombres del proyecto** (enum `EstadoSolicitud`, DTO reales), no inventados.
- [ ] No hace *over-mocking*: no verifica detalles de implementación que cambiarían sin cambiar el comportamiento.
- [ ] Es **determinista** (sin `Thread.sleep`, sin hora real, sin orden dependiente).
- [ ] No contiene **secretos ni datos personales reales**.
- [ ] Sigue las **convenciones** (nombre con `US-xx CA-n`, patrón Given-When-Then).
- [ ] El autor **entiende cada línea** y puede explicarla en la sustentación.

### 10.3 Evidencia

Para al menos 3 casos significativos se documenta: prompt → prueba generada → defectos encontrados en ella → versión final, y se anota el resultado de la verificación (p. ej. mutación detectada).

---

## 11. Cobertura y *quality gates*

| Métrica | Umbral | Herramienta | Efecto |
|:---|:---:|:---|:---|
| Cobertura de líneas backend (global) | **≥ 70 %** | JaCoCo | El *build* falla si baja |
| Cobertura frontend (global) | ≥ 60 % | Vitest `--coverage` | Aviso; falla bajo 50 % |
| Pruebas | 100 % en verde | CI | Bloquea el merge |
| Hallazgos de seguridad | 0 altos/críticos | CodeQL / ZAP / gitleaks | Bloquea el merge |
| Smell/duplicación | Sin *blockers* | CodeQL / Sonar (opcional) | Revisión |

La cobertura es un **indicador de huecos, no un objetivo en sí**: una cobertura alta con aserciones débiles no cumple el espíritu de esta estrategia ([§10.2](#102-lista-de-verificación-de-una-prueba-generada-por-ia)).

---

## 12. Gestión de defectos

| Aspecto | Regla |
|:---|:---|
| Registro | *Issue* con etiqueta `bug`, pasos para reproducir, resultado esperado/obtenido, ambiente, `traceId` y evidencia |
| Severidad | **Crítico** (bloquea flujo principal o seguridad) · **Alto** · **Medio** · **Bajo** |
| Flujo | `fix/issue-XX-…` desde `develop` ([Gobernanza](../04-gestion/equipo-y-flujo-de-trabajo.md)); toda corrección incluye una **prueba de regresión** que falla sin el arreglo |
| Criterio de salida del RC | 0 críticos y 0 altos abiertos; medios con plan; bajos documentados |

---

## 13. Informe de pruebas (entregable)

Se entrega como `docs/INFORME_PRUEBAS.md` (y PDF) al final de la Fase 2. Estructura (se omiten las secciones de pruebas que no se hayan ejecutado):

1. **Resumen ejecutivo:** estado de calidad, hallazgos principales, recomendación (apto / apto con reservas).
2. **Alcance y ambiente:** versión probada (`tag`), ambiente, datos, herramientas y versiones.
3. **Resultados por nivel:** unitarias, integración, API, autorización (cifras de cobertura y reportes).
4. **Aceptación:** tabla CA → prueba → resultado; resultados UAT-01…UAT-06, UAT-09 y UAT-10.
5. **Pruebas de usuario:** SUS, tareas completadas, hallazgos de usabilidad.
6. **Seguridad:** resultados SAST/DAST, dependencias, secretos, *payloads* manuales y estado de cada hallazgo.
7. **Rendimiento:** resultados de §8 con gráficos, cuello de botella y conclusión frente a RNF-02/12.
8. **Observabilidad:** evidencia de logs con `traceId`, métricas, alertas y simulacro.
9. **Uso de IA en pruebas:** casos de §10.3.
10. **Defectos:** lista, severidad, estado; defectos abiertos y riesgos residuales.
11. **Conclusiones y mejoras** (cierra el ciclo "monitorear → mejorar").
12. **Anexos:** reportes JaCoCo, ZAP, k6, colección Bruno ejecutada, capturas.

---

## 14. Catálogo de casos de prueba prioritarios

Casos mínimos que **deben existir** antes del RC (no es exhaustivo; cada `spec` aporta más). Nivel: **U** unitaria · **I** integración · **A** API · **S** seguridad · **R** rendimiento.

| ID | Descripción | Esperado | Niv. | Traza |
|:---|:---|:---|:---:|:---|
| TC-001 | Login con credenciales válidas | 200 + JWT + perfil | U/A | US-01 |
| TC-002 | Login con clave errónea y con correo inexistente | 401 idéntico, sin pista | U/A/S | US-01 |
| TC-004 | Registro con `@gmail.com` | 400 con error en `correo` | U/A | US-02, RN-02 |
| TC-005 | Registro con `"rol":"ADMIN"` | 400; no se crea admin | A/S | US-03, RN-04 |
| TC-006 | Token expirado/manipulado/`alg:none` | 401 | A/S | RNF-01 |
| TC-007 | Crear solicitud válida con imagen | 201, `SOL-AAAA-NNNN`, estado `REGISTRADA`, historial `NULL→REGISTRADA` | I/A | US-05, 07 |
| TC-008 | Crear solicitud sin categoría / descripción de 10 caracteres | 400 y **0 filas** nuevas | A | US-05 |
| TC-009 | Crear con `.exe` renombrado a `.jpg` | 415/400; sin fila ni archivo | U/A/S | US-06, RN-15 |
| TC-010 | Crear con archivo de 6 MB | 413 | A | US-06 |
| TC-011 | Descripción con `<script>alert(1)</script>` | 400 `errores.descripcion` | U/A/S | RN-18 |
| TC-013 | Fallo al guardar archivo a mitad de alta | Rollback total; sin solicitud huérfana | I | RNF-04 |
| TC-014 | Asignar desde `REGISTRADA` | `ASIGNADA`; historial con 2 filas | U/I | US-08, ADR-003 |
| TC-015 | Asignar técnico de otra área | 400/409 | U/A | RN-07 |
| TC-016 | Estudiante llama `…/asignar` | 403 y BD sin cambios | A/S | US-08 |
| TC-017 | Resolver una solicitud `REGISTRADA` | 409 "debe estar en atención" | U/A | US-10, RN-06 |
| TC-018 | Resolver sin evidencia o con informe corto | 400 | U/A | RN-12 |
| TC-019 | Técnico B resuelve solicitud de técnico A | 404/403 | A/S | RN-16 |
| TC-022 | `UPDATE`/`DELETE` en historial | Error del trigger | I | RN-17 |
| TC-023 | Estudiante A lee solicitud de B | 404 | A/S | RN-16 |
| TC-024 | Dashboard supervisor TI vs admin | Supervisor ve solo su área; admin global | I/A | RN-16 |
| TC-025 | Métricas con dataset conocido | Pendientes/MTTR/vencidas/% exactos | I | RN-11 |
| TC-026 | Desactivar categoría | `DELETE`→204, `activo=false`; ya no aparece en el formulario; sigue visible en solicitudes previas | I/A | RN-14 |
| TC-027 | Desactivar usuario con JWT vigente | 401 en la siguiente petición | A/S | RN-22 |
| TC-028 | Excepción forzada | 500 genérico + `traceId`; *stacktrace* en log con el mismo id | I | RNF-06 |
| TC-031 | Carga nominal 50 VU | P95 ≤ 300 ms; error < 1 % | R | RNF-02 |
| TC-032 | Estrés hasta 500 VU y recuperación | Punto de quiebre documentado; recuperación automática | R | RNF-07 |
| TC-033 | `docker compose up` en máquina limpia | 3 servicios *healthy*; login funciona | A | RNF-09 |
| TC-034 | Dos réplicas de backend sin afinidad | Operación correcta | R/A | RNF-03 |
