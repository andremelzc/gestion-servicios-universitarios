# Plan 03 — Diseño técnico de la Gestión de Solicitudes

> Matriz de transiciones y diagramas de secuencia: [Arquitectura §2 y §6.3](../../docs/02-diseno/arquitectura-tecnica.md). Contratos: [API §3.2–3.3](../../docs/02-diseno/api-rest.md#32-solicitudes--solicitudes). Tablas: [Modelo de datos](../../docs/02-diseno/modelo-datos.md). Este plan define **cómo se implementa** el workflow, no vuelve a listar endpoints.

## 1. Backend (paquetes `solicitud` y `comentario`)

### 1.1 Componentes

| Clase | Responsabilidad |
|:---|:---|
| `SolicitudWorkflowService` | **Único** lugar que cambia el estado de una solicitud. Método genérico `ejecutar(Transicion, solicitudId, actor, datos)` + métodos de conveniencia (`evaluar`, `asignar`, `iniciarAtencion`, `resolver`, `cerrar`). |
| `Transicion` (enum) | `EVALUAR`, `ASIGNAR`, `REASIGNAR`, `INICIAR_ATENCION`, `RESOLVER`, `CERRAR`. Cada valor define sus estados de origen, destino y quién puede ejecutarla (matriz de la Arquitectura §2.2). |
| `AccessPolicy` | `puedeVer`, `puedeEjecutar(actor, solicitud, transicion)`, y cálculo de `accionesPermitidas` (lo que ve el frontend). **Una sola implementación** de RN-16. |
| `HistorialService` | Inserta filas de historial; no expone actualización ni borrado. |
| `ComentarioService` | Alta y listado con filtro por visibilidad (RN-19). |
| `SolicitudController` | Endpoints de transición; delega todo en el workflow; `@PreAuthorize` por rol como primera barrera. |
| `UsuarioController#tecnicos` | `GET /usuarios/tecnicos` con el área forzada para supervisores. |

### 1.2 Algoritmo de una transición

```
@Transactional
ejecutar(transicion, id, actor, datos):
  s = repo.findById(id)
  si s no existe o !accessPolicy.puedeVer(actor, s):   throw NoEncontrado          # 404 (RN-16)
  si !accessPolicy.puedeEjecutar(actor, s, transicion):  throw Prohibido           # 403
  si s.estado no está en transicion.origenes:            throw TransicionInvalida  # 409 (RN-06)
  transicion.validarDatos(datos)                         # 400: informe ≥20, evidencia…
  estadoAnterior = s.estado
  # atajo (ADR-003): si viene de REGISTRADA y la transición es ASIGNAR,
  #   primero se registra REGISTRADA → EN_EVALUACION
  transicion.aplicar(s, actor, datos)                    # campos y fechas (matriz §2.3)
  historial.registrar(s, actor, estadoAnterior, s.estado, nota)
  return SolicitudDetalle(s, accessPolicy.accionesPermitidas(actor, s))
```

Puntos de diseño:
- **Concurrencia:** el estado se valida dentro de la transacción; una segunda petición contradictoria ve el estado ya cambiado y recibe 409.
- **Atomicidad:** cualquier excepción revierte estado, historial y evidencias de solución.
- **Resolver (multipart):** valida y guarda evidencias con `FileStorageService` (mismas reglas del spec 02) *antes* de cambiar el estado; compensación de archivos si falla la transacción.
- **Cálculos de tiempo** con `Clock` inyectado (pruebas deterministas).
- **Reasignar:** mismo estado (`ASIGNADA`) o `EN_ATENCION → ASIGNADA`; el historial deja la nota "de X a Y".

### 1.3 `AccessPolicy` — reglas resumidas

| Pregunta | Regla |
|:---|:---|
| ¿Puede **ver**? | `ADMIN` siempre · `ESTUDIANTE`/solicitante: `solicitante == actor` · `TECNICO`: `tecnico == actor` (o es el solicitante) · `SUPERVISOR`: `categoria.area == actor.area` (o es el solicitante) |
| ¿Es "solicitante"? | `solicitud.solicitante.id == actor.id` (propiedad, no rol) |
| ¿Puede evaluar/asignar? | `SUPERVISOR` del área o `ADMIN` |
| ¿Puede iniciar/resolver? | Técnico asignado o `ADMIN` |
| ¿Puede cerrar? | Solicitante, `SUPERVISOR` del área o `ADMIN` |
| ¿Puede comentar? | Quien puede ver (solicitante, técnico asignado, supervisor del área, admin) **y** la solicitud no es final; privado solo roles internos |

### 1.4 Bandeja (`GET /solicitudes`)
`Specification` compuesta: alcance por rol (técnico → `tecnico = actor`; supervisor → `categoria.area = actor.area`; admin → sin restricción) **AND** filtros opcionales (estado repetible, prioridad, categoría, técnico, texto en código/título, rango de fechas, `vencidas`). Ordenamiento contra **lista blanca** de campos (`fechaRegistro`, `prioridad`, `fechaLimiteSla`, `estado`). Proyección DTO con la bandera `vencida` calculada en SQL (`estado IN (pendientes) AND fecha_limite_sla < UTC_TIMESTAMP()`).

---

## 2. Frontend (feature `gestion`)

| Componente | Detalle |
|:---|:---|
| `BandejaSupervisorPage.jsx` | Pestañas "Por asignar / En curso / Resueltas / Todas"; filtros (estado, prioridad, categoría, técnico, búsqueda, "solo vencidas"); tabla/tarjetas; indicador de SLA (a tiempo / por vencer / vencida con **texto e icono**, no solo color). |
| `BandejaTecnicoPage.jsx` | Lista de asignadas por estado ("Por iniciar", "En curso", "Resueltas") optimizada para móvil. |
| `ModalAsignacion.jsx` | Selector de prioridad definitiva y técnico (`GET /usuarios/tecnicos`) mostrando la **carga actual** de cada técnico; nota opcional. |
| `ModalResolucion.jsx` | Informe (mín. 20) + `FileUploader` (1–3 evidencias obligatorias). |
| `ModalCierre.jsx` | Confirmación de cierre con nota opcional. |
| `LineaTiempoHistorial.jsx` | `Timeline` vertical con actor, estado y hora local (America/Lima). |
| `ComentariosPanel.jsx` | Lista + formulario; casilla "Privado (solo cuadrilla)" visible solo para roles internos. |
| `AccionesSolicitud.jsx` | Renderiza botones **únicamente** según `accionesPermitidas` del backend. |

## 3. Riesgos y controles

| Riesgo | Control |
|:---|:---|
| Saltar la máquina de estados llamando a la API | Validación en servidor + pruebas de transiciones inválidas |
| Dos usuarios actúan a la vez | Validación del estado en la transacción y 409 |
| Un técnico actúa sobre tickets ajenos | `AccessPolicy` (404/403) |
| Historial manipulado | Triggers + sin API de edición |
| Lógica duplicada en el frontend | `accionesPermitidas` calculado en servidor |

## 4. Plan de pruebas
Trazabilidad en [`01-spec.md` §5](01-spec.md#5-matriz-de-trazabilidad); casos TC-014…TC-022 del [catálogo](../../docs/03-calidad-y-operacion/estrategia-pruebas.md#14-catálogo-de-casos-de-prueba-prioritarios); UAT-04…UAT-06. Se exigen pruebas de las transiciones inválidas más comunes contra la matriz oficial.
