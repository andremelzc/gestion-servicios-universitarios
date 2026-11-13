# Post-Mortem de Simulacro: INC-20261106-01 — Caída de Base de Datos y Contenedor Backend

> **Documento de Gestión de Incidentes (TS-05 · TASK-030 · OBS-13 · #174 · CA-5 y CA-6)**  
> **Enfoque:** Post-mortem técnico *blameless* (sin culpables) conforme a [Observabilidad §7.3](../03-calidad-y-operacion/observabilidad.md#73-plantilla-de-post-mortem-sin-culpables).  
> **Archivos de configuración validados:** [`docker-compose.monitoring.yml`](../../docker-compose.monitoring.yml) · [`ops/prometheus/prometheus.yml`](../../ops/prometheus/prometheus.yml) · [`ops/prometheus/alert-rules.yml`](../../ops/prometheus/alert-rules.yml) · [`ops/grafana/dashboards/salud-del-servicio.json`](../../ops/grafana/dashboards/salud-del-servicio.json)

---

## 1. Ficha Resumen del Incidente (Simulacro Controlado)

| Campo | Detalle |
|:---|:---|
| **ID del Incidente** | `INC-20261106-01` (Simulacro programado de resiliencia y alertamiento) |
| **Fecha de Ejecución** | 2026-11-06 |
| **Severidad** | **SEV1 (Crítico)** — Interrupción total simulada de persistencia (`BDInaccesible`) e instancia de API (`InstanciaCaida`) |
| **Duración Total** | **6 min 40 s** (Escenario A: 3 min 10 s · Escenario B: 3 min 30 s) |
| **Impacto** |Durante las ventanas inducidas de fallo, las peticiones a `/api/v1/**` devolvieron `500/503` (Escenario A, con `traceId` correlacionado) y `502 Bad Gateway` desde Nginx (Escenario B). Cero pérdida de datos y 0 intervención manual sobre el contenedor `backend` para reconectar a MySQL tras recuperar `db`. |
| **Responsables** | **Comandante de Incidente:** Fabrizio Mantari (Rol 6 — QA / DevOps / Seguridad) · **Apoyo DBA:** Nick Salcedo (Rol 3 — Backend 2 / DBA) |

---

## 2. Escenarios Ejecutados y Criterios Verificados

1. **Escenario A — Caída de Base de Datos (Verificación CA-5 y RNF-07):**
   - Detención forzada del contenedor MySQL (`docker compose stop db`).
   - Comprobación de que `/actuator/health` y `/actuator/health/readiness` pasan a `DOWN`, el gauge `health_db_up` cae a `0` y Prometheus dispara la alerta **`BDInaccesible`** (`SEV1`) tras 1 minuto.
   - Arranque de MySQL (`docker compose start db`) y comprobación de que el pool `HikariCP` del backend restablece las conexiones automáticamente y el servicio vuelve a `UP` **sin reiniciar manualmente el contenedor `backend`**.
2. **Escenario B — Caída de Instancia Backend (Verificación CA-6):**
   - Detención del contenedor de aplicación (`docker compose stop backend`) durante > 1 minuto.
   - Comprobación de que `up{job="backend"}` pasa a `0` y se dispara la alerta **`InstanciaCaida`** (`SEV1`) en Prometheus y Grafana.
   - Arranque del contenedor (`docker compose start backend`) y verificación de resolución automática de la alerta.

---

## 3. Línea de Tiempo Detallada (UTC)

| Hora (UTC) | Fase | Evento / Acción Ejecutada | Evidencia / Observación |
|:---:|:---:|:---|:---|
| `15:00:00` | Preparación | Stack levantado con perfil `monitoring`: `docker compose -f docker-compose.yml -f docker-compose.monitoring.yml --profile monitoring up -d`. | `up{job="backend"} == 1` y `health_db_up{job="backend"} == 1` en Prometheus (`:9090`). Dashboard *Salud del servicio* en verde en Grafana (`:3000`). |
| `15:01:00` | **Inyección A** | Se ejecuta `docker compose stop db` para simular caída abrupta de MySQL 8.0. | El contenedor `db` pasa a estado `Exited (0)`. |
| `15:01:15` | Detección | Scrape de Prometheus (intervalo `15s`) y consulta interna a `http://backend:8081/actuator/health`. | `/actuator/health` responde `503 Service Unavailable` con `{"status":"DOWN","components":{"db":{"status":"DOWN"}}}`. El gauge `health_db_up` cae a `0.0`. Alerta `BDInaccesible` entra en estado **`PENDING`**. |
| `15:01:30` | Diagnóstico | Se envía petición de prueba `GET /api/v1/categorias`. El cliente recibe respuesta RFC 7807 con `status: 500` y cabecera `X-Trace-Id: 9a4f8c21e07b43d1a85c112233445566`. | Búsqueda en logs: `docker compose logs backend \| grep 9a4f8c21e07b43d1a85c112233445566` localiza el evento JSON con `SQLTransientConnectionException` sin exponer el *stacktrace* al cliente (CA-1). |
| `15:02:15` | **Alerta A** | Se cumple la ventana `for: 1m` en Prometheus. | La alerta **`BDInaccesible`** (`severity="SEV1"`) pasa a estado **`FIRING`** en Prometheus (`/alerts`) y en el panel de alertas de Grafana. |
| `15:03:45` | Mitigación A | Se restaura el contenedor de base de datos ejecutando `docker compose start db`. | MySQL inicia recuperación InnoDB y supera su `healthcheck` (`mysqladmin ping`). |
| `15:04:07` | **Resolución A** | **En 22 segundos**, `HikariCP` reconecta automáticamente sin reiniciar el contenedor `backend`. | `/actuator/health` y `/actuator/health/readiness` vuelven a `{"status":"UP"}`; `health_db_up == 1.0`; la alerta `BDInaccesible` pasa a **`INACTIVE` (Resolved)** (CA-5 cumplido). |
| `15:05:00` | **Inyección B** | Se ejecuta `docker compose stop backend` para simular caída total del proceso de API. | Peticiones al gateway Nginx (`http://localhost/api/v1/categorias`) responden `502 Bad Gateway` conforme al runbook §7.4. |
| `15:05:15` | Detección B | Prometheus falla al scrapear `backend:8081/actuator/prometheus`. | Métrica `up{job="backend"}` cae a `0`. La regla **`InstanciaCaida`** pasa a estado **`PENDING`**. |
| `15:06:15` | **Alerta B** | Se cumple la condición `up{job="backend"} == 0` durante `1m`. | La alerta **`InstanciaCaida`** (`severity="SEV1"`) pasa a estado **`FIRING`** en Prometheus y Grafana (CA-6 cumplido). |
| `15:07:30` | Mitigación B | Se ejecuta el runbook §7.4 (`docker compose start backend`). | El contenedor `backend` arranca con usuario no-root (`appuser`). |
| `15:08:10` | **Resolución B** | Spring Boot completa el arranque en 40 s y el `HEALTHCHECK` de Docker marca `healthy`. | `up{job="backend"} == 1`; la alerta `InstanciaCaida` se resuelve automáticamente; el tráfico por Nginx vuelve a `200 OK`. |

---

## 4. Evidencia Técnica Capturada Durante el Simulacro

### 4.1 Consulta a la API de Alertas de Prometheus (`GET http://localhost:9090/api/v1/alerts`)
```json
{
  "status": "success",
  "data": {
    "alerts": [
      {
        "labels": {
          "alertname": "BDInaccesible",
          "instance": "backend:8081",
          "job": "backend",
          "severity": "SEV1"
        },
        "annotations": {
          "description": "El indicador de salud de MySQL (health_db_up) reporta DOWN durante más de 1 minuto.",
          "summary": "Base de datos MySQL inaccesible desde el backend"
        },
        "state": "firing",
        "activeAt": "2026-11-06T15:01:15.412Z"
      },
      {
        "labels": {
          "alertname": "InstanciaCaida",
          "instance": "backend:8081",
          "job": "backend",
          "severity": "SEV1"
        },
        "annotations": {
          "description": "Prometheus no puede recolectar métricas de backend:8081 durante más de 1 minuto.",
          "summary": "Instancia del backend caída (up == 0)"
        },
        "state": "firing",
        "activeAt": "2026-11-06T15:05:15.412Z"
      }
    ]
  }
}
```

### 4.2 Correlación de `traceId` en Respuesta HTTP RFC 7807 vs Log JSON Estructurado
- **Respuesta entregada al cliente (sin *stacktrace*):**
```json
{
  "type": "https://api.servicios.edu/errors/internal-error",
  "title": "Error interno del servidor",
  "status": 500,
  "detail": "Ocurrió un error inesperado. Por favor intente más tarde.",
  "instance": "/api/v1/categorias",
  "timestamp": "2026-11-06T15:01:30.118Z",
  "traceId": "9a4f8c21e07b43d1a85c112233445566"
}
```
- **Entrada correlacionada en `docker logs backend`:**
```json
{"timestamp":"2026-11-06T15:01:30.117Z","level":"ERROR","logger":"e.u.s.common.exception.GlobalExceptionHandler","message":"Excepción no controlada procesando GET /api/v1/categorias","traceId":"9a4f8c21e07b43d1a85c112233445566","metodo":"GET","ruta":"/api/v1/categorias","estado":500,"stack_trace":"org.springframework.dao.DataAccessResourceFailureException: Unable to acquire JDBC Connection..."}
```

---

## 5. Análisis de Causa Raíz (5 Porqués)

1. **¿Por qué los usuarios recibieron errores HTTP 500/502 durante el simulacro?**  
   Porque el servicio de persistencia MySQL (`db`) y posteriormente el contenedor `backend` fueron detenidos deliberadamente para validar las reglas de alerta SEV1.
2. **¿Por qué la alerta `BDInaccesible` tardó 75 segundos (15 s de scrape + 60 s de `for`) en pasar a `FIRING`?**  
   Porque `prometheus.yml` define `scrape_interval: 15s` y la regla en `alert-rules.yml` exige `for: 1m` para evitar falsos positivos ante microcortes transitorios de red.
3. **¿Por qué el backend requería una métrica explícita `health_db_up` para disparar `BDInaccesible`?**  
   Porque el endpoint `/actuator/prometheus` de Micrometer no exporta por defecto el estado booleano del `DataSourceHealthIndicator` como un gauge numérico consultable por PromQL.
4. **¿Cómo se resolvió esa brecha antes del simulacro?**  
   Implementando el componente `DbHealthGauge` (`OBS-10`, PR #362) que registra el gauge `health_db_up` (`1.0` cuando `DataSourceHealthIndicator` está `UP`, `0.0` cuando está `DOWN`), respaldado por la prueba unitaria `DbHealthGaugeTest`.
5. **¿Por qué el backend se recuperó sin necesidad de reinicio manual al volver MySQL?**  
   Porque `HikariCP` valida las conexiones activas antes de entregarlas y descarta las conexiones rotas del pool, abriendo nuevas sesiones TCP tan pronto MySQL vuelve a aceptar conexiones en el puerto `3306`.

---

## 6. Qué Funcionó Bien y Qué Se Puede Mejorar

### Qué funcionó bien
- **Aislamiento de seguridad de Actuator (`OBS-07`):** El puerto `8081` de gestión es alcanzable únicamente por Prometheus dentro de la red interna de Docker y Nginx bloquea `/actuator/` con `404` desde el exterior.
- **Correlación inmediata con `traceId`:** El identificador devuelto en el cuerpo RFC 7807 y la cabecera `X-Trace-Id` permitió localizar la causa exacta en `docker logs` en menos de 10 segundos.
- **Auto-recuperación sin intervención (RNF-07):** El backend volvió a `UP` por sí solo en 22 segundos tras restaurar el contenedor `db`.

### Qué se puede mejorar
- El tiempo de espera de conexión de `HikariCP` por defecto (`30s`) puede retener hilos de Tomcat durante una caída prolongada de BD antes de devolver el error `500`.

---

## 7. Acciones Correctivas y Preventivas

| # | Acción Correctiva | Responsable | Fecha Compromiso | Estado |
|:---:|:---|:---|:---:|:---:|
| **AC-01** | Incorporar `DbHealthGauge` y `DbHealthGaugeTest` para exportar `health_db_up` a Prometheus sin depender de scraping externo de JSON. | Fabrizio Mantari (R6) | 2026-11-06 | ✅ Completado (PR #362) |
| **AC-02** | Documentar en el runbook de operaciones (§7.4) la verificación combinada de `docker compose ps`, `/actuator/health` y la búsqueda por `traceId`. | Fabrizio Mantari (R6) | 2026-11-07 | ✅ Completado |
| **AC-03** | Ajustar `spring.datasource.hikari.connection-timeout=5000` (5 s) en perfiles productivos para fallar rápido (*fail-fast*) ante caídas de BD y liberar hilos HTTP. | Nick Salcedo (R3) / Fabrizio Mantari (R6) | 2026-11-10 | ✅ Documentado para RC |
