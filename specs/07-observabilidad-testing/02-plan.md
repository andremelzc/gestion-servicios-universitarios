# Plan 07 — Diseño técnico de Observabilidad y Pruebas

> No duplica los documentos fuente: [Observabilidad](../../docs/03-calidad-y-operacion/observabilidad.md) (arquitectura, formato de logs, métricas, alertas PromQL, incidentes, runbooks, configuración) y [Estrategia de pruebas](../../docs/03-calidad-y-operacion/estrategia-pruebas.md) (niveles, herramientas, casos TC, k6, informe). Aquí: componentes a implementar y decisiones.

## 1. Observabilidad

### 1.1 Componentes (backend)

| Clase / configuración | Función |
|:---|:---|
| `TraceIdFilter` (`common/web`) | Lee `traceparent` o genera `traceId`; lo pone en el MDC y en la cabecera `X-Trace-Id`; limpia el MDC al terminar. Primero de la cadena de filtros. |
| `GlobalExceptionHandler` | Para `Exception` no controlada: log `ERROR` con *stacktrace* + `traceId`; respuesta 500 genérica con el mismo `traceId`. |
| `MetricsConfig` + `NegocioMetrics` | Contadores de negocio básicos (transiciones y solicitudes creadas) con **etiquetas de baja cardinalidad**. |
| `logback-spring.xml` (o `logging.structured.format.console`) | JSON a *stdout* en `test`/`prod`; texto legible en `dev`. Campos del [formato](../../docs/03-calidad-y-operacion/observabilidad.md#31-formato). |
| Dependencias | `spring-boot-starter-actuator`, `micrometer-registry-prometheus`, `micrometer-tracing-bridge-otel`, `opentelemetry-exporter-otlp`. |

### 1.2 Infraestructura (`ops/`)
- `ops/prometheus/prometheus.yml` (scrape `backend:8080/actuator/prometheus` cada 15 s) y `alert-rules.yml` con 3 reglas de [Observabilidad §6](../../docs/03-calidad-y-operacion/observabilidad.md#6-alertas).
- `ops/grafana/provisioning` (datasources, *alerting*) y `dashboards/*.json`: **Salud del servicio**.
- `docker-compose.monitoring.yml` (perfil `monitoring`): Prometheus, Grafana y Jaeger *all-in-one* (visor de trazas OTLP).

---

## 2. Pruebas

### 2.1 Estructura de carpetas

```
backend/src/test/java/…
├── unit/           (service, workflow, validadores, AccessPolicy)       *Test
├── integration/    (repositorios con Testcontainers, triggers, dashboard) *IT
├── web/            (@WebMvcTest, seguridad, errores)                     *ControllerTest
├── security/       (AutorizacionMatrizTest, payloads)
└── support/        (builders, MySqlContainer compartido, Clock fijo)
frontend/src/**/*.test.jsx   (+ test/setup.js, mocks MSW)
api-tests/                    (colección Bruno única: auth, solicitudes, gestión, dashboard, admin; env/)
tests/performance/            (k6: escenario.js con la mezcla de login, solicitudes y dashboard; thresholds.js)
```

### 2.2 Decisiones
- **Testcontainers compartido** por JVM (`@Testcontainers` con contenedor `static` reutilizable) para no pagar el arranque en cada clase.
- **`Clock` inyectable** en servicios con tiempo (SLA y fechas).
- **Builders** de datos de prueba; prohibido el orden implícito entre pruebas.
- **Nombres** `@DisplayName("[US-xx CA-n] …")` para trazar criterios.
- **Cobertura:** JaCoCo (umbrales en [Spec 06](../06-devops-seguridad/02-plan.md#21-backend-maven)); Vitest con `--coverage`.
- **k6:** `setup()` obtiene tokens una vez; escenarios con `ramping-vus`; umbrales en código; salida a Prometheus (`experimental-prometheus-rw`) o JSON para el informe; datos sembrados con `DemoDataSeeder` en modo `carga` (~2 000 filas).

### 2.3 Orden de ejecución en CI
1. Unitarias (rápidas) → 2. Integración (Testcontainers) → 3. Cobertura y umbrales → 4. API (Bruno) contra el stack Compose → 5. (nocturno) carga corta de humo.

## 3. Riesgos

| Riesgo | Mitigación |
|:---|:---|
| Pruebas lentas frenan el desarrollo | Contenedor compartido; paralelizar; separar `*Test` de `*IT` |
| Pruebas frágiles (hora real, orden) | `Clock` fijo; builders; aislamiento por transacción |
| Medir carga en un ambiente pequeño | Dimensionar *staging* como producción; documentar recursos |
| Métricas de alta cardinalidad | Revisión en PR; lista de etiquetas permitidas |
| Logs con datos sensibles | Revisión de PR (no se loguean contraseñas ni tokens) |
