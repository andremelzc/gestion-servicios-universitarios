# Spec 04 — Dashboard e Indicadores (KPIs)

## 1. Ficha

| Campo | Valor |
|:---|:---|
| **Épica** | E4 — Dashboard e indicadores |
| **Historia (HU)** | HU-05 Visualización de métricas y KPIs |
| **Historias divididas (US)** | US-12, US-13, US-14, US-28, US-29, US-30 |
| **Requerimientos** | RF-08 · RN-09, RN-10, RN-11, RN-16 · RNF-02, RNF-12 |
| **Roles afectados** | `ADMIN` (global) · `SUPERVISOR` (su área) · `TECNICO` (solo sus asignadas) · `ESTUDIANTE` (sin acceso) |
| **Prioridad** | **Must** |
| **Dependencias** | Solicitudes con historial de estados (specs 02 y 03) · Definiciones de métricas en [SRS RN-11](../../docs/01-definicion/especificaciones-tecnicas.md#4-reglas-de-negocio-rn) · Contrato [API §3.4](../../docs/02-diseno/api-rest.md#34-dashboard--dashboard) · Plan: [`02-plan.md`](02-plan.md) · Tareas: [`03-tasks.md`](03-tasks.md) |
| **Fuera de alcance** | Exportación a Excel/PDF (*Could*); gráficos configurables por el usuario; métricas en tiempo real por *websocket* |

**Objetivo:** ofrecer una vista consolidada de la eficiencia operativa que cubre **todos los indicadores del enunciado**: solicitudes registradas, pendientes, atendidas, por categoría, por prioridad, tiempo promedio de atención, % resueltas, vencidas y por responsable.

---

## 2. Historias de usuario

| ID | Historia | Indicador / criterio | Prio. |
|:---|:---|:---|:---:|
| **US-12** | Como administrador/supervisor, quiero ver el **total de registradas, pendientes y atendidas**. | Tarjetas con números exactos según RN-11; se actualizan al recargar o cambiar filtros. | M |
| **US-13** | Como supervisor, quiero un gráfico de **solicitudes por categoría**. | La suma del gráfico = total filtrado; solo categorías del área del supervisor (RN-16). | M |
| **US-14** | Como administrador, quiero ver el **tiempo promedio de atención (MTTR)**. | Promedio de (`fecha_resolucion` − `fecha_registro`) en horas, solo resueltas (RN-11). | M |
| **US-28** | Como supervisor, quiero ver **solicitudes por prioridad y por estado**. | Dos distribuciones; valores y colores consistentes con los catálogos. | M |
| **US-29** | Como supervisor, quiero ver las **solicitudes vencidas**. | Contador y lista paginada de las pendientes con `fecha_limite_sla` pasada (RN-10). | M |
| **US-30** | Como supervisor, quiero ver **solicitudes por responsable** y el **% de resueltas**. | Barras por técnico (con asignadas); % = resueltas ÷ registradas (RN-11). | M |

---

## 3. Definiciones (RN-11)

| Indicador | Definición exacta |
|:---|:---|
| **Registradas** | Total de solicitudes en el rango de fechas y alcance |
| **Pendientes** | Estados `REGISTRADA`, `EN_EVALUACION`, `ASIGNADA`, `EN_ATENCION` |
| **Atendidas** | Estados `RESUELTA`, `CERRADA` |
| **% Resueltas** | Atendidas ÷ Registradas × 100, con un decimal; `0` si el denominador es 0 |
| **MTTR (h)** | Promedio de (`fecha_resolucion` − `fecha_registro`) en horas de las solicitudes con `fecha_resolucion` no nula; `null` si no hay |
| **Vencidas** | Pendientes con `fecha_limite_sla` < ahora (UTC) |
| **Por responsable** | Conteo por `id_tecnico_asignado` (excluye sin asignar) |
| **Alcance** | `ADMIN`: global (o `idArea` indicado) · `SUPERVISOR`: `categoria.id_area` = su área · `TECNICO`: `id_tecnico_asignado` = él |
| **Rango de fechas** | Por `fecha_registro`; por defecto, últimos 30 días |

---

## 4. Criterios de aceptación (BDD)

### CA-1 — KPIs globales del administrador *(US-12, US-14)*
```gherkin
Dado un conjunto conocido de 150 solicitudes: 14 REGISTRADA, 22 EN_EVALUACION, 9 ASIGNADA, 5 EN_ATENCION, 30 RESUELTA, 70 CERRADA
Cuando un administrador consulta GET /api/v1/dashboard/kpis
Entonces registradas = 150
  Y pendientes = 50 (14 + 22 + 9 + 5)
  Y atendidas = 100 (30 + 70)
  Y porcentajeResueltas = 100 ÷ 150 = 66.7
  Y mttrHoras es el promedio de horas entre registro y resolución de las 100 atendidas
```

### CA-2 — Aislamiento del supervisor *(US-12, RN-16)*
```gherkin
Dado un supervisor del área "Mantenimiento e Infraestructura"
Cuando consulta cualquier endpoint /api/v1/dashboard/*
Entonces todos los totales provienen ÚNICAMENTE de solicitudes cuya categoría pertenece a su área
  Y el parámetro idArea enviado por él se ignora
```

### CA-3 — Alcance del técnico *(RN-16)*
```gherkin
Dado un técnico con 8 solicitudes asignadas
Cuando consulta GET /api/v1/dashboard/kpis
Entonces las cifras corresponden solo a sus 8 solicitudes
```

### CA-4 — Sin acceso para estudiantes
```gherkin
Dado un usuario con rol ESTUDIANTE
Cuando consulta cualquier /api/v1/dashboard/*
Entonces responde 403 y la interfaz no muestra la opción "Dashboard"
```

### CA-5 — Distribución por categoría *(US-13)*
```gherkin
Dado un administrador en el Dashboard
Cuando se llama a GET /api/v1/dashboard/por-categoria
Entonces el backend ejecuta una agregación SQL (COUNT ... GROUP BY categoría) sin cargar entidades a memoria
  Y devuelve [{"nombre": "Redes y Wi-Fi", "valor": 30}, ...] consumible directamente por Recharts
  Y la suma de los valores es igual a "registradas" para el mismo filtro
```

### CA-6 — Distribución por prioridad y por estado *(US-28)*
```gherkin
Cuando se llama a GET /api/v1/dashboard/por-prioridad y /por-estado
Entonces devuelve un elemento por prioridad/estado existente (incluidos los de valor 0) en el orden de "ponderador"/"orden"
  Y por-estado incluye colorHex de cada estado
```

### CA-7 — MTTR con datos conocidos *(US-14)*
```gherkin
Dado 3 solicitudes resueltas con tiempos de 2 h, 4 h y 6 h entre registro y resolución, y una abierta
Cuando se consulta el MTTR
Entonces mttrHoras = 4.0 (la abierta no cuenta)
```
```gherkin
Dado que una solicitud fue reabierta (fecha_resolucion = NULL) y aún no se vuelve a resolver
Entonces no cuenta para el MTTR hasta que vuelva a resolverse
```

### CA-8 — Solicitudes vencidas *(US-29)*
```gherkin
Dado una solicitud EN_ATENCION con fecha_limite_sla de ayer, y una RESUELTA con fecha_limite_sla de ayer
Cuando se consulta vencidas
Entonces solo la EN_ATENCION cuenta como vencida (RN-10)
  Y GET /api/v1/dashboard/vencidas devuelve la lista paginada ordenada por mayor retraso
```

### CA-9 — Por responsable *(US-30)*
```gherkin
Dado que Carlos tiene 18 solicitudes asignadas y Lucía 11
Cuando se consulta GET /api/v1/dashboard/por-responsable
Entonces devuelve [{"nombre":"Carlos Ruiz","valor":18},{"nombre":"Lucía Vega","valor":11}] ordenado de mayor a menor
```

### CA-10 — Filtro por fechas *(US-12)*
```gherkin
Dado un rango desde=2026-10-01 y hasta=2026-10-15
Cuando se consulta cualquier endpoint
Entonces solo se consideran solicitudes con fecha_registro dentro del rango (inclusive)
  Y si desde > hasta responde 400
```

### CA-11 — Sin datos
```gherkin
Dado un rango sin solicitudes
Cuando se consultan los KPIs
Entonces registradas = 0, pendientes = 0, atendidas = 0, porcentajeResueltas = 0 y mttrHoras = null
  Y la interfaz muestra "—" en el MTTR y estados vacíos en los gráficos (no gráficos rotos)
```

### CA-12 — Rendimiento *(RNF-02, RNF-12)*
```gherkin
Dado ~2 000 solicitudes sembradas y 50 usuarios concurrentes
Cuando se consultan los endpoints del dashboard
Entonces el percentil 95 de la respuesta es ≤ 300 ms (objetivo de diseño 150 ms)
```

### CA-13 — Presentación accesible *(RNF-05, RNF-10)*
```gherkin
Dado un usuario en el Dashboard
Cuando visualiza los gráficos
Entonces cada gráfico tiene título, leyenda con valores y una alternativa en tabla ("Ver datos")
  Y las KPI se disponen en 1 columna en móvil y 4–5 en escritorio sin scroll horizontal
```

---

## 5. Matriz de trazabilidad

| Criterio | Historia | Pruebas esperadas |
|:---|:---:|:---|
| CA-1, CA-7, CA-8, CA-9, CA-10, CA-11 | US-12/14/29/30 | `DashboardRepositoryIT` con dataset conocido (TC-025) |
| CA-2, CA-3, CA-4 | RN-16 | `DashboardControllerTest`, `AutorizacionMatrizTest` (TC-024) |
| CA-5, CA-6 | US-13/28 | `DashboardServiceTest`, `KpiCard.test`, `CategoriaPieChart.test` |
| CA-12 | RNF-02/12 | k6 (escenario nominal, TC-031) |
| CA-13 | RNF-05/10 | Revisión manual de accesibilidad |
