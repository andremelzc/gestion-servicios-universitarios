# Tareas 04 — Dashboard

> Tareas de planificación: **TASK-016** (BE), **TASK-017** (FE). Marcar `[x]` solo al cumplir la [DoD](../../docs/04-gestion/equipo-y-flujo-de-trabajo.md#4-definición-de-hecho-dod).

## Fase 1 — Datos y consultas (BE) · R3

| ☐ | # | Tarea | US | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---|
| [ ] | 1.1 | Dataset de prueba conocido (150 solicitudes en 6 estados, 2 áreas, fechas variadas) para `DashboardRepositoryIT` | todos | Dataset versionado |
| [ ] | 1.2 | `DashboardRepository.kpis` con **una sola consulta** de agregación condicional | US-12/14/30 | CA-1, CA-7 |
| [ ] | 1.3 | `porCategoria`, `porPrioridad` (RIGHT JOIN), `porEstado` (con color), `porResponsable` | US-13/28/30 | CA-5, CA-6, CA-9 |
| [ ] | 1.4 | `vencidas` paginada y ordenada por mayor retraso | US-29 | CA-8 |

## Fase 2 — Servicio y controlador (BE) · R3

| ☐ | # | Tarea | US | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---|
| [ ] | 2.1 | `ScopeResolver` (admin/supervisor/técnico) | RN-16 | CA-2, CA-3 |
| [ ] | 2.2 | `DashboardService` (cálculo de %, MTTR `null`, conversión de rango de fechas) | US-12/14/30 | CA-10, CA-11 |
| [ ] | 2.3 | `DashboardController` (6 endpoints), validación `desde ≤ hasta`, `@PreAuthorize`, OpenAPI | todos | CA-4, CA-10 |
| [ ] | 2.4 | DTO `record` (`KpisResponse`, `SerieItem`, `SerieEstadoItem`) conforme a [API §3.4](../../docs/02-diseno/api-rest.md#34-dashboard--dashboard) | todos | Revisión de contrato |

## Fase 3 — Frontend · R5

| ☐ | # | Tarea | US | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---|
| [ ] | 3.1 | `DashboardPage` con filtros, `Promise.all`, `AbortController` y estados por widget | US-12 | UAT-10 |
| [ ] | 3.2 | `KpiCard` y rejilla responsive (1/2/5 columnas) | US-12 | CA-13 |
| [ ] | 3.3 | `CategoriaPieChart`, `PrioridadBarChart`, `EstadoBarChart`, `ResponsableBarChart` con leyenda y "Ver datos" | US-13/28/30 | CA-5, CA-6, CA-9 |
| [ ] | 3.4 | `VencidasTable` con enlace al detalle | US-29 | CA-8 |
| [ ] | 3.5 | Estados vacío/error/carga y valor "—" para MTTR nulo | — | CA-11 |
| [ ] | 3.6 | Ocultar opción "Dashboard" para `ESTUDIANTE`; filtro "Área" solo para admin | RN-16 | CA-4 |

## Fase 4 — Calidad · R6

| ☐ | # | Tarea | Evidencia |
|:-:|:-:|:---|:---|
| [ ] | 4.1 | Prueba de alcance con dos áreas (supervisor TI no ve datos de Mantenimiento) | TC-024 |
| [ ] | 4.2 | Sembrar ~2 000 solicitudes (seeder en modo `carga`); el dashboard entra en el escenario k6 común | TC-031, CA-12 |
| [ ] | 4.3 | Pruebas de componente de gráficos con datos vacíos y con datos | `Charts.test` |
| [ ] | 4.4 | Colección Bruno `04-dashboard` | Reporte en el PR |
| [ ] | 4.5 | Registrar en el [Registro de IA](../../docs/04-gestion/ia-register.md) todo uso de IA en este módulo | Entradas con validación |
