# Spec-Driven Development (SDD)

Este directorio aplica **Spec-Driven Development**: antes de implementar un módulo se escribe **qué** debe hacer (spec), **cómo** se construirá (plan) y **qué pasos** concretos lo completan (tareas). Cada carpeta contiene tres archivos con nombres fijos para que cualquier integrante —o un agente de IA— siga el flujo sin perder contexto.

| Archivo | Responde a | Contenido |
|:---|:---|:---|
| **`01-spec.md`** | **Qué** y para quién | Ficha (épica, historias, requerimientos, roles, dependencias, fuera de alcance), historias de usuario con validaciones, reglas aplicables y **criterios de aceptación en Gherkin (BDD)** con matriz de trazabilidad |
| **`02-plan.md`** | **Cómo** | Diseño técnico: componentes, algoritmos, decisiones, frontend, riesgos y controles. **No repite** contratos ni esquema: los enlaza |
| **`03-tasks.md`** | **Paso a paso** | Checklist por fase con historia, rol responsable y **evidencia/prueba** que demuestra cada tarea hecha |

## Fuentes únicas (no se duplican aquí)

| Tema | Dónde está |
|:---|:---|
| Requerimientos (RF/RNF/RN), historias, trazabilidad | [`docs/01-definicion/especificaciones-tecnicas.md`](../docs/01-definicion/especificaciones-tecnicas.md) |
| Contratos de API (rutas, JSON, códigos, matriz de autorización) | [`docs/02-diseno/api-rest.md`](../docs/02-diseno/api-rest.md) |
| Esquema físico y datos maestros | [`database/migrations/`](../database/migrations/V1__esquema_inicial.sql) · [`docs/02-diseno/modelo-datos.md`](../docs/02-diseno/modelo-datos.md) |
| Máquina de estados | [`docs/02-diseno/arquitectura-tecnica.md` §2](../docs/02-diseno/arquitectura-tecnica.md#2-máquina-de-estados-de-las-solicitudes) |
| Decisiones y conflictos resueltos | [`docs/02-diseno/decisiones-arquitectura.md`](../docs/02-diseno/decisiones-arquitectura.md) |

## Módulos

| # | Carpeta | Épica / historias técnicas | Prioridad | Tareas (roadmap) |
|:-:|:---|:---|:---:|:---|
| 01 | [`01-autenticacion/`](01-autenticacion/01-spec.md) | E1 · HU-01, HU-07 · US-01…04, 18 | Must | TASK-004, 005, 032 |
| 02 | [`02-registro-solicitudes/`](02-registro-solicitudes/01-spec.md) | E2 · HU-02, HU-08 · US-05…07, 21 | Must | TASK-006, 007, 008 |
| 03 | [`03-gestion-solicitudes/`](03-gestion-solicitudes/01-spec.md) | E3 · HU-03, 04, 09, 10 · US-08…11, 23, 25, 27 | Must / Should | TASK-009, 010, 011, 034, 035 |
| 04 | [`04-dashboard/`](04-dashboard/01-spec.md) | E4 · HU-05 · US-12…14, 28…30 | Must | TASK-016, 017 |
| 05 | [`05-administracion/`](05-administracion/01-spec.md) | E5 · HU-06 · US-15…17, 31…34 | Must | TASK-018 |
| 06 | [`06-devops-seguridad/`](06-devops-seguridad/01-spec.md) | ET · TS-01…04, 08, 09 | Must | TASK-001, 015, 019, 027, 028, 029 |
| 07 | [`07-observabilidad-testing/`](07-observabilidad-testing/01-spec.md) | ET · TS-05…07 | Must | TASK-012, 020, 021, 030, 031, 036, 037 |
| 08 | [`08-entregables-ia/`](08-entregables-ia/01-spec.md) | ET · TS-10…12 | Must | TASK-003, 014, 022, 023, 024, 026, 033, 038 |

## Flujo de trabajo con SDD

1. **Leer** el `01-spec.md` del módulo (qué y criterios BDD) y el `02-plan.md` (cómo).
2. **Crear el issue** a partir de la plantilla de historia de usuario, copiando los escenarios BDD del spec; rama `feature/US-xx-…` ([Gobernanza](../docs/04-gestion/equipo-y-flujo-de-trabajo.md)).
3. **Construir** siguiendo `03-tasks.md`; cada tarea cita la prueba que la demuestra.
4. **Probar:** los nombres de las pruebas citan `[US-xx CA-n]` para que la matriz de trazabilidad del spec sea verificable.
5. **Cerrar** con la [Definición de Hecho](../docs/04-gestion/equipo-y-flujo-de-trabajo.md#4-definición-de-hecho-dod): criterios BDD cumplidos, pruebas, CI verde, documentación fuente actualizada, uso de IA registrado.
6. **Si algo cambia** (una regla, un contrato), se actualiza **primero su fuente única** y luego el spec afectado; nunca se copia el contenido.

> **Convención de criterios:** `CA-n` es local a cada spec (CA-1 del spec 01 ≠ CA-1 del spec 02). Para citar un criterio de otro módulo se escribe `spec 02 · CA-5`.
