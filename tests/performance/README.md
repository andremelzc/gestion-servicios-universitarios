# Ejecución de Pruebas de Rendimiento, Carga y Estrés con k6 (QA-15 · QA-16 · #176 · #177)

> **Historias:** TS-07 · **Requerimientos:** RNF-02 (P95 ≤ 300 ms a 50 VU), RNF-07 (resiliencia y recuperación tras pico de estrés hasta 500 VU), RNF-12 (BD con ~2 000 solicitudes sembradas).
> **Script único:** [`carga.js`](carga.js) · **Resúmenes exportados:** [`resultados/nominal-50vu-summary.json`](resultados/nominal-50vu-summary.json) y [`resultados/estres-500vu-summary.json`](resultados/estres-500vu-summary.json).

---

## 1. Preparación del Ambiente (`DemoDataSeeder` modo `carga`)

Antes de ejecutar cualquiera de los dos perfiles, el ambiente se levanta con **2 000 solicitudes** sembradas (`DEMO_SOLICITUDES=2000`) para garantizar que las consultas paginadas de `mis-solicitudes`, la bandeja operativa y las agregaciones de `/api/v1/dashboard/kpis` operen sobre un volumen representativo (RNF-12):

```bash
DEMO_SOLICITUDES=2000 docker compose --profile monitoring up -d --build
```

---

## 2. Ejecución del Perfil 1: Carga Nominal (`PERFIL=nominal`, 50 VU, 10 min)

### Comando ejecutado
```bash
docker run --rm -i \
  -e DEMO_USER_PASSWORD \
  -e PERFIL=nominal \
  -e BASE_URL=http://host.docker.internal \
  -v "$(pwd)/tests/performance/resultados:/resultados" \
  grafana/k6 run --summary-export=/resultados/nominal-50vu-summary.json - < tests/performance/carga.js
```

### Resultados obtenidos (`nominal-50vu-summary.json`)

| Métrica / Endpoint | Umbral (`thresholds`) | Promedio (`avg`) | Mediana (`p50`) | `p(90)` | `p(95)` | `p(99)` | Estado |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `http_req_duration{endpoint:solicitudes}` | `p(95) < 300 ms` | 118.6 ms | 92.3 ms | 184.0 ms | **218.0 ms** | 284.1 ms | ✅ Cumple |
| `http_req_duration{endpoint:dashboard}` | `p(95) < 300 ms` | 112.0 ms | 104.2 ms | 168.0 ms | **195.0 ms** | 248.0 ms | ✅ Cumple |
| `http_req_duration{endpoint:login}` | `p(95) < 800 ms` | 275.0 ms | 271.5 ms | 331.0 ms | **342.0 ms** | 354.2 ms | ✅ Cumple |
| `http_req_failed` (tasa global de error) | `rate < 0.01` (< 1 %) | — | — | — | **0.00 %** (0 / 14 250) | — | ✅ Cumple |

---

## 3. Ejecución del Perfil 2: Estrés y Recuperación (`PERFIL=estres`, rampa hasta 500 VU)

### Comando ejecutado
```bash
docker run --rm -i \
  -e DEMO_USER_PASSWORD \
  -e PERFIL=estres \
  -e BASE_URL=http://host.docker.internal \
  -v "$(pwd)/tests/performance/resultados:/resultados" \
  grafana/k6 run --summary-export=/resultados/estres-500vu-summary.json - < tests/performance/carga.js
```

### Evolución por escalón y punto de quiebre (`estres-500vu-summary.json`)

| Escalón de la rampa | Usuarios Virtuales (VU) | Latencia `p(95)` | Tasa de error | Observación en Prometheus / Grafana |
|:---|:---:|:---:|:---:|:---|
| **Inicio / Base** | 50 VU | 218 ms | 0.00 % | Operación nominal dentro de RNF-02 |
| **Escalón 1** (2 min) | 100 VU | 310 ms | 0.00 % | `hikaricp_connections_active` promedio: 7 / 10 |
| **Escalón 2** (3 min) | 300 VU | 720 ms | 0.42 % | `hikaricp_connections_pending` empieza a encolar peticiones |
| **Punto de quiebre** | **380 VU** | **1 050 ms** (> 1 s) | **1.15 %** | Saturación de `HikariCP maximum-pool-size=10` en escrituras multipart |
| **Pico máximo** (5 min) | **500 VU** | **1 840 ms** | **3.40 %** | Encolamiento en HikariCP y Nginx; 0 caídas de contenedor (`up == 1`) |
| **Recuperación** (3 min) | **50 VU** | **225 ms** | **0.00 %** | **Auto-recuperación en < 45 s** sin reinicio manual ni corrupción de datos (CA-16 / RNF-07) |
