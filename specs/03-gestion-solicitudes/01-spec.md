# Spec 03 — Gestión y Ciclo de Vida de Solicitudes

## 1. Ficha

| Campo | Valor |
|:---|:---|
| **Épica** | E3 — Gestión y ciclo de vida de solicitudes |
| **Historias (HU)** | HU-03 Evaluación y asignación · HU-04 Atención y resolución · HU-09 Cierre · HU-10 Comentarios |
| **Historias divididas (US)** | US-08, US-09, US-10, US-11, US-23, US-25, US-27 |
| **Requerimientos** | RF-04, RF-05, RF-06, RF-07, RF-13 · RN-06, RN-07, RN-09, RN-12, RN-16, RN-17, RN-19, RN-21 |
| **Roles afectados** | `SUPERVISOR` (evalúa, asigna, cierra) · `TECNICO` (atiende, resuelve) · `ESTUDIANTE` (cierra, comenta) · `ADMIN` (todas) |
| **Prioridad** | **Must** (US-08…11, 23, 25) · **Should** (US-27) |
| **Dependencias** | Spec 02 (solicitudes existentes) · Matriz de transiciones en [Arquitectura §2](../../docs/02-diseno/arquitectura-tecnica.md#2-máquina-de-estados-de-las-solicitudes) · Contrato [API §3.2–3.3](../../docs/02-diseno/api-rest.md#32-solicitudes--solicitudes) · Plan: [`02-plan.md`](02-plan.md) · Tareas: [`03-tasks.md`](03-tasks.md) |
| **Fuera de alcance** | Motor de workflow configurable (los estados/transiciones son de código, [ADR-009](../../docs/02-diseno/decisiones-arquitectura.md#adr-009--los-estados-son-un-catálogo-de-presentación-no-de-comportamiento)); asignación automática por carga; SLA en horas hábiles; rechazo, cancelación, reapertura, calificación y notificaciones (el enunciado define 6 estados) |

**Objetivo:** orquestar el ciclo de vida del ticket (evaluación, asignación, atención, resolución, cierre) con **reglas estrictas de transición**, **autorización por rol y por recurso** y un **historial inmutable**.

---

## 2. Historias de usuario

| ID | Historia | Validaciones / reglas | Prio. |
|:---|:---|:---|:---:|
| **US-08** | Como supervisor, quiero **ver las solicitudes de mi área y asignarlas** a un técnico de mi equipo. | Técnico **activo del área de la categoría** (RN-07); estado `ASIGNADA`; se guarda técnico y supervisor; puede reasignar hasta `RESUELTA`. | M |
| **US-23** | Como supervisor, quiero **evaluar y ajustar la prioridad** para que la urgencia sea correcta. | `REGISTRADA → EN_EVALUACION`; si cambia la prioridad se recalcula el SLA (RN-09). | M |
| **US-09** | Como técnico, quiero **marcar que inicié la atención**. | Solo el técnico asignado (o admin); `ASIGNADA → EN_ATENCION`; guarda `fecha_inicio_atencion`. | M |
| **US-10** | Como técnico, quiero **resolver con un informe y evidencia** de la solución. | Informe ≥ 20 caracteres y ≥ 1 evidencia `SOLUCION` (RN-12); `EN_ATENCION → RESUELTA`; guarda `fecha_resolucion`. | M |
| **US-11** | Como sistema, quiero **guardar un historial automático** de cada cambio de estado. | Una fila por transición en la **misma transacción**; tabla inmutable (triggers) (RN-17). | M |
| **US-25** | Como solicitante o supervisor, quiero **cerrar la solicitud** para confirmar la solución. | `RESUELTA → CERRADA`; guarda `fecha_cierre`. | M |
| **US-27** | Como participante, quiero **comentar** una solicitud, con opción de comentario **privado de cuadrilla**. | 1–500 caracteres, sin HTML; privados solo para técnico/supervisor/admin (RN-19); no en estados finales. | S |

---

## 3. Reglas aplicables
Todas las transiciones y su efecto están en la [matriz de Arquitectura §2.2](../../docs/02-diseno/arquitectura-tecnica.md#22-matriz-de-transiciones-y-permisos) y los efectos secundarios en [§2.3](../../docs/02-diseno/arquitectura-tecnica.md#23-efectos-secundarios-de-cada-transición). Aquí se verifican con escenarios. Recordatorio clave: **403** = rol sin permiso · **404** = recurso fuera de alcance (RN-16) · **409** = transición no permitida (RN-06).

---

## 4. Criterios de aceptación (BDD)

### Evaluación y asignación

#### CA-1 — Asignación desde `EN_EVALUACION` *(US-08)*
```gherkin
Dado una solicitud en estado EN_EVALUACION cuya categoría pertenece al área "Tecnologías de la Información"
  Y un supervisor del área "Tecnologías de la Información"
Cuando asigna al técnico activo "Carlos Ruiz" (área TI) con PUT /api/v1/solicitudes/{id}/asignar {"idTecnico": 14}
Entonces responde 200 y el estado es ASIGNADA
  Y id_tecnico_asignado = 14, id_supervisor_asignador = el supervisor y fecha_asignacion se registra
  Y el historial tiene una fila nueva (EN_EVALUACION → ASIGNADA, usuario = supervisor)
```

#### CA-2 — Asignación directa desde `REGISTRADA` (atajo) *(US-08, ADR-003)*
```gherkin
Dado una solicitud en estado REGISTRADA
Cuando el supervisor del área la asigna directamente a un técnico válido
Entonces el estado final es ASIGNADA
  Y el historial contiene DOS filas consecutivas: REGISTRADA → EN_EVALUACION y EN_EVALUACION → ASIGNADA
  Y ambas se guardan en la misma transacción
```

#### CA-3 — Usuario sin rol autorizado *(US-08)*
```gherkin
Dado un usuario con rol ESTUDIANTE o TECNICO
Cuando envía PUT /api/v1/solicitudes/{id}/asignar
Entonces responde 403 Forbidden y no se modifica la base de datos
```

#### CA-4 — Técnico de otra área o inactivo *(RN-07)*
```gherkin
Dado una solicitud de la categoría "Electricidad" (área Mantenimiento)
Cuando el supervisor intenta asignar a un técnico del área TI, o a un técnico con activo = false
Entonces responde 400 (o 409) con el detalle de la regla incumplida y la solicitud no cambia
```

#### CA-5 — Supervisor de otra área *(RN-16)*
```gherkin
Dado un supervisor del área TI y una solicitud de una categoría del área Mantenimiento
Cuando intenta evaluarla, asignarla o verla
Entonces responde 404 Not Found
```

#### CA-6 — Evaluar y cambiar la prioridad *(US-23)*
```gherkin
Dado una solicitud REGISTRADA con prioridad BAJA (SLA 72 h) de una categoría con SLA 48 h
Cuando el supervisor la evalúa con PUT .../evaluar {"idPrioridad": <CRITICA>}
Entonces el estado es EN_EVALUACION y la prioridad es CRITICA
  Y fecha_limite_sla se recalcula como fecha_registro + MIN(4 h, 48 h) = +4 h
  Y el historial registra REGISTRADA → EN_EVALUACION
```

#### CA-7 — *(retirado)*
*Rechazar solicitudes salió del alcance el 03/10/2026 (el enunciado define 6 estados). La numeración CA se conserva.*

#### CA-8 — Reasignación *(US-08)*
```gherkin
Dado una solicitud en ASIGNADA o EN_ATENCION asignada a "Carlos"
Cuando el supervisor la reasigna a "Lucía" (mismo área, activa)
Entonces el estado es ASIGNADA con técnico "Lucía"
  Y el historial registra la nota "Reasignada de Carlos Ruiz a Lucía Vega"
```

### Atención y resolución

#### CA-9 — Iniciar atención *(US-09)*
```gherkin
Dado una solicitud ASIGNADA al técnico "Carlos"
Cuando Carlos envía PUT .../iniciar-atencion
Entonces el estado es EN_ATENCION y se registra fecha_inicio_atencion y el historial
```
```gherkin
Cuando otro técnico ("Lucía") intenta iniciar la atención de esa solicitud
Entonces responde 404 y no hay cambios
```

#### CA-10 — Resolver con informe y evidencia *(US-10)*
```gherkin
Dado una solicitud EN_ATENCION asignada al técnico autenticado
Cuando envía PUT .../resolver (multipart) con informe "Se reemplazó el conector RJ45 dañado" y 1 foto JPG
Entonces responde 200 y el estado es RESUELTA
  Y informe_resolucion queda guardado y existe 1 evidencia tipo SOLUCION
  Y fecha_resolucion registra la marca de tiempo (base del MTTR)
  Y el historial inserta "EN_ATENCION → RESUELTA por Carlos" con el informe en la nota
```

#### CA-11 — Resolver sin evidencia o con informe corto *(RN-12)*
```gherkin
Dado una solicitud EN_ATENCION
Cuando el técnico envía el informe sin archivos, o un informe de 10 caracteres
Entonces responde 400 con el detalle y el estado sigue EN_ATENCION
```

#### CA-12 — Violación de la máquina de estados *(RN-06)*
```gherkin
Dado una solicitud en estado REGISTRADA
Cuando un técnico (o admin) hace PUT .../resolver
Entonces el backend responde 409 Conflict con "La solicitud debe estar EN_ATENCION para ser resuelta"
  Y no se modifica ningún dato
```
*(Se repite para cada par de estados no permitidos de la matriz: p. ej. `CERRADA → cualquiera`, `ASIGNADA → RESUELTA`.)*

#### CA-13 — Historial inmutable *(US-11, RN-17)*
```gherkin
Dado un registro existente en historial_solicitudes
Cuando se intenta ejecutar UPDATE o DELETE sobre él (por SQL directo o desde la aplicación)
Entonces la base de datos rechaza la operación con SQLSTATE 45000
```
```gherkin
Cuando falla cualquier parte de una transición (p. ej. la escritura del historial)
Entonces la transición completa se revierte y la solicitud conserva su estado anterior
```

### Cierre y reapertura

#### CA-14 — Cerrar *(US-25)*
```gherkin
Dado una solicitud RESUELTA
Cuando el solicitante original (o el supervisor del área) envía PUT .../cerrar
Entonces el estado es CERRADA y fecha_cierre se registra
```
```gherkin
Cuando un tercero que no es solicitante ni supervisor del área intenta cerrar
Entonces responde 404 (fuera de alcance) o 403 (rol)
```

#### CA-15 — *(retirado)*
*Reabrir y calificar el servicio salieron del alcance el 03/10/2026. La numeración CA se conserva.*

### Bandeja y alcance

#### CA-16 — Bandeja con filtros y alcance por rol *(US-08, RF-12)*
```gherkin
Dado solicitudes de las áreas TI y Mantenimiento
Cuando un supervisor de TI consulta GET /api/v1/solicitudes?estado=REGISTRADA&idPrioridad=3&q=proyector
Entonces recibe solo solicitudes de categorías del área TI que cumplan todos los filtros, paginadas
  Y cada elemento incluye "vencida" (RN-10)
```
```gherkin
Cuando un técnico consulta la bandeja
Entonces recibe solo las solicitudes asignadas a él
Cuando un administrador consulta
Entonces recibe todas las solicitudes
```

#### CA-17 — Lista de técnicos del área *(US-08)*
```gherkin
Dado un supervisor de TI
Cuando consulta GET /api/v1/usuarios/tecnicos
Entonces recibe solo técnicos activos del área TI (aunque envíe idArea de otra área)
```

### Comentarios

#### CA-18 — Comentarios públicos y privados *(US-27, RN-19)*
```gherkin
Dado una solicitud abierta con un comentario público del solicitante y un comentario privado del técnico
Cuando el solicitante consulta GET .../comentarios
Entonces solo ve el comentario público
Cuando el supervisor consulta
Entonces ve ambos
```
```gherkin
Cuando un estudiante envía un comentario con "privado": true
Entonces responde 403
```

#### CA-19 — Comentarios en estados finales *(RN-19)*
```gherkin
Dado una solicitud en CERRADA
Cuando alguien intenta comentar
Entonces responde 409 y no se crea el comentario
```

#### CA-20 — *(retirado)*
*Las notificaciones salieron del alcance el 03/10/2026. La numeración CA se conserva.*

---

## 5. Matriz de trazabilidad

| Criterio | Historia | Pruebas esperadas |
|:---|:---:|:---|
| CA-1, CA-2, CA-8 | US-08 | `SolicitudWorkflowServiceTest#asignar*` (TC-014), `AsignacionIT` |
| CA-3, CA-5, CA-17 | US-08 / RN-16 | `AutorizacionMatrizTest` (TC-016, TC-019, TC-023) |
| CA-4 | RN-07 | `SolicitudWorkflowServiceTest#tecnicoDeOtraArea` (TC-015) |
| CA-6 | US-23 | `SlaCalculatorTest`, `EvaluarTest` |
| CA-9, CA-10, CA-11 | US-09/10 | `ResolverTest` (TC-017, TC-018) |
| CA-12 | RN-06 | `TransicionesInvalidasTest` (transiciones inválidas más comunes) |
| CA-13 | US-11 | Prueba SQL de los triggers (TC-022) |
| CA-14 | US-25 | `CerrarTest` |
| CA-16 | RF-12 | `BandejaSpecificationIT` |
| CA-18, CA-19 | US-27 | `ComentarioServiceTest` |
