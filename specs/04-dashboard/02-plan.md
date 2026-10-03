# Plan 04 — Diseño técnico del Dashboard

> Contratos en [`docs/02-diseno/api-rest.md` §3.4](../../docs/02-diseno/api-rest.md#34-dashboard--dashboard). Definiciones de métricas en el [spec](01-spec.md#3-definiciones-rn-11) y consultas de referencia en [`docs/02-diseno/modelo-datos.md` §6](../../docs/02-diseno/modelo-datos.md#6-consultas-de-referencia-dashboard). **No hay tablas nuevas.**

## 1. Backend (paquete `dashboard`)

### 1.1 Componentes

| Clase | Responsabilidad |
|:---|:---|
| `DashboardController` | 6 endpoints `GET /dashboard/*`; `@PreAuthorize("hasAnyRole('TECNICO','SUPERVISOR','ADMIN')")`; valida `desde ≤ hasta`. |
| `DashboardService` | Resuelve el **alcance** del actor (`ScopeResolver`) y delega en el repositorio; arma los DTO. |
| `ScopeResolver` | Convierte rol → filtro: `ADMIN` → `idArea` opcional; `SUPERVISOR` → `idArea = actor.idArea` (ignora el parámetro); `TECNICO` → `idTecnico = actor.id`. Única fuente del aislamiento (RN-16). |
| `DashboardRepository` | Consultas **agregadas** con parámetros nombrados (JPQL de proyección o SQL nativo). Nunca trae entidades a memoria (RN de rendimiento). |
| DTO | `KpisResponse`, `SerieItem(nombre, valor)`, `SerieEstadoItem(nombre, valor, colorHex)`, `Page<SolicitudResumen>` para vencidas. |

### 1.2 Filtro común de las consultas

```sql
-- Fragmento reutilizado en todas las agregaciones (parámetros opcionales como NULL)
FROM solicitudes s
JOIN categorias c ON c.id = s.id_categoria
WHERE s.fecha_registro >= :desde AND s.fecha_registro < :hastaExclusivo
  AND (:idArea    IS NULL OR c.id_area = :idArea)
  AND (:idTecnico IS NULL OR s.id_tecnico_asignado = :idTecnico)
```
`hastaExclusivo = hasta + 1 día` para incluir todo el último día. Las fechas llegan en UTC; el frontend envía el rango en hora de Lima convertido a UTC.

### 1.3 Consultas por indicador

| Endpoint | Estrategia SQL |
|:---|:---|
| `/kpis` | **Una sola consulta** con agregación condicional: `COUNT(*)`, `SUM(estado IN (pendientes))`, `SUM(estado IN ('RESUELTA','CERRADA'))`, `AVG(TIMESTAMPDIFF(MINUTE, fecha_registro, fecha_resolucion))/60` donde `fecha_resolucion IS NOT NULL`, `SUM(estado IN (pendientes) AND fecha_limite_sla < UTC_TIMESTAMP())`. El % se calcula en el servicio a partir de esos conteos. |
| `/por-categoria` | `GROUP BY c.id, c.nombre` |
| `/por-prioridad` | `RIGHT JOIN prioridades p` para incluir las de valor 0; `ORDER BY p.ponderador` |
| `/por-estado` | `RIGHT JOIN estados_solicitud e` + `color_hex`; `ORDER BY e.orden` |
| `/por-responsable` | `JOIN usuarios u ON u.id = s.id_tecnico_asignado GROUP BY u.id ORDER BY valor DESC` |
| `/vencidas` | Pendientes con `fecha_limite_sla < UTC_TIMESTAMP()`, paginado, orden por `fecha_limite_sla ASC` (mayor retraso primero) |

Una consulta única para `/kpis` reduce 5 recorridos a 1 y mantiene la **consistencia** entre tarjetas.

### 1.4 Rendimiento
- Índices ya definidos: `(estado, fecha_registro)`, `(id_categoria, estado)`, `(id_prioridad, estado)`, `(id_tecnico_asignado, estado)`, `fecha_limite_sla`.
- Objetivo de diseño ≤ 150 ms, SLO ≤ 300 ms P95 con ~2 000 filas (RNF-12).
- **Caché:** no se implementa en el MVP (datos en vivo). Si hiciera falta, caché de 30–60 s con clave por `(rol, alcance, rango)`.

---

## 2. Frontend (feature `dashboard`)

| Componente | Detalle |
|:---|:---|
| `DashboardPage.jsx` | Barra de filtros (desde/hasta, y *Área* solo para admin) con valor por defecto "últimos 30 días"; carga los 5 endpoints en paralelo con `Promise.all` (cancelable con `AbortController`); estados *cargando/vacío/error* por widget (un fallo no tumba toda la página). |
| `KpiCard.jsx` | Props `{ titulo, valor, unidad, icono, descripcion }`; formato numérico es-PE; `—` si `null`. |
| `CategoriaPieChart.jsx` | Dona de Recharts + leyenda con valores y % ; "Ver datos" (tabla). |
| `PrioridadBarChart.jsx`, `EstadoBarChart.jsx` | Barras con etiquetas; el estado usa `colorHex` con texto/patrón además del color. |
| `ResponsableBarChart.jsx` | Barras horizontales (nombre largo) ordenadas. |
| `VencidasTable.jsx` | Lista paginada con enlace al detalle de cada solicitud. |
| Layout | CSS Grid: KPIs 1 col (móvil) → 2 (tablet) → 5 (escritorio); gráficos apilados en móvil. |
| Accesibilidad | Cada gráfico con `role="img"` + `aria-label` resumen y tabla alternativa; paleta con contraste verificado ([UX §2.1](../../docs/01-definicion/ux-ui-prototipo.md#21-color)). |

La paleta de series usa los colores de estado/prioridad definidos por el sistema de diseño, no colores aleatorios de la librería.

## 3. Riesgos y controles

| Riesgo | Control |
|:---|:---|
| Fuga de datos entre áreas | `ScopeResolver` central + pruebas de alcance con datos de dos áreas |
| Inconsistencia entre tarjetas | Consulta única de KPIs; definiciones RN-11 en un solo lugar |
| Consultas lentas con muchos datos | Índices y agregación en BD; prueba con los datos de demostración |
| Zonas horarias (corte de día) | Fechas en UTC en BD; el frontend convierte el rango desde America/Lima |
| Parámetro `idArea` manipulado por un supervisor | Se ignora; el área sale del token |

## 4. Plan de pruebas
Trazabilidad en [`01-spec.md` §5](01-spec.md#5-matriz-de-trazabilidad); datos de prueba con el dataset del CA-1 (150 solicitudes en 6 estados) en `DashboardRepositoryIT`; k6 en la fase de rendimiento.
