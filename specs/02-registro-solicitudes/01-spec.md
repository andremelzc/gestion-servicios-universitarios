# Spec 02 — Registro y Seguimiento de Solicitudes

## 1. Ficha

| Campo | Valor |
|:---|:---|
| **Épica** | E2 — Registro y seguimiento de solicitudes |
| **Historias (HU)** | HU-02 Registro de nueva solicitud · HU-08 Seguimiento por el solicitante |
| **Historias divididas (US)** | US-05, US-06, US-07, US-21 |
| **Requerimientos** | RF-03, RF-12 · RN-01, RN-09, RN-15, RN-16, RN-18, RN-23 |
| **Roles afectados** | `ESTUDIANTE` (crea y sigue) · `TECNICO`/`SUPERVISOR`/`ADMIN` (también pueden registrar) |
| **Prioridad** | **Must** |
| **Dependencias** | Datos maestros `V2` (categorías, prioridades, estados) · Autenticación (spec 01) · Contrato: [API §3.2](../../docs/02-diseno/api-rest.md#32-solicitudes--solicitudes) · Plan: [`02-plan.md`](02-plan.md) · Tareas: [`03-tasks.md`](03-tasks.md) |
| **Fuera de alcance** | Edición de una solicitud ya enviada; creación en nombre de terceros (*Could*); adjuntos de tipos distintos a JPG/PNG/PDF |

**Objetivo:** permitir reportar una incidencia o servicio con **categoría, prioridad, ubicación, descripción y evidencia**, obtener un **código único de seguimiento** y poder consultar el estado y el historial propios.

---

## 2. Historias de usuario

| ID | Historia | Validaciones (frontend **y** backend) | Prio. |
|:---|:---|:---|:---:|
| **US-05** | Como estudiante, quiero **registrar una solicitud** con título, categoría, prioridad, ubicación y descripción para informar un problema. | Título 5–150. Descripción **15–500**, sin HTML. Campus y ubicación obligatorios (≤ 100). Categoría y prioridad: listas desplegables **obligatorias** de elementos **activos**. | M |
| **US-06** | Como estudiante, quiero **adjuntar fotos o un PDF** como evidencia. | Opcional. JPG/PNG/PDF, **≤ 5 MB** c/u, **≤ 3** archivos. Se valida por **contenido** (firma) en el servidor. Si excede, se bloquea el envío. | M |
| **US-07** | Como sistema, quiero **generar un código único** por solicitud. | Formato `SOL-AAAA-NNNN` (RN-01); sin duplicados. | M |
| **US-21** | Como solicitante, quiero **ver mis solicitudes y su detalle** (estado, historial, evidencias) para hacer seguimiento. | Listado paginado con filtros por estado y búsqueda por código/título; solo propias (RN-16). | M |

---

## 3. Reglas aplicables
- **RN-01** código `SOL-AAAA-NNNN` · **RN-09** `fecha_limite_sla = registro + MIN(SLA prioridad, SLA categoría)` · **RN-15** evidencias · **RN-16** aislamiento de datos (404 si ajena) · **RN-18** sin HTML · **RN-23** la prioridad inicial es una propuesta.
- Toda solicitud nace `REGISTRADA`; el solicitante es **siempre** el usuario del JWT (el cliente no puede indicar otro).
- El alta (solicitud + evidencias + historial `NULL → REGISTRADA`) es **una sola transacción** (RNF-04).

---

## 4. Criterios de aceptación (BDD)

### CA-1 — Registro exitoso con imagen *(US-05, US-06, US-07)*
```gherkin
Dado un estudiante autenticado en "Nueva solicitud"
Cuando selecciona la categoría "Equipos de Cómputo" y la prioridad "ALTA",
  ingresa el título "Proyector sin imagen", la ubicación "Campus Central / Pabellón B - Aula 402",
  una descripción de al menos 15 caracteres y adjunta una imagen JPG de 1.5 MB
  y envía el formulario
Entonces el servidor responde 201 Created con Location /api/v1/solicitudes/{id}
  Y el cuerpo contiene codigo "SOL-2026-0001" (correlativo del año), estado "REGISTRADA" y fechaLimiteSla
  Y la solicitud queda guardada en MySQL con id_usuario_solicitante = usuario del token
  Y existe 1 evidencia tipo INICIAL con nombre aleatorio y mime "image/jpeg"
  Y el historial tiene la fila (estado_anterior = NULL, estado_nuevo = REGISTRADA)
  Y el frontend muestra la pantalla de confirmación con el código
```

### CA-2 — Registro sin evidencia *(US-06)*
```gherkin
Dado un estudiante que completa el formulario sin adjuntar archivos
Cuando envía
Entonces la solicitud se crea correctamente (la evidencia es opcional)
```

### CA-3 — Campos obligatorios omitidos *(US-05)*
```gherkin
Dado un usuario completando el formulario
Cuando intenta enviar sin categoría, o con descripción de 10 caracteres, o con título vacío
Entonces el frontend bloquea el envío y marca los campos con su mensaje
  Y si se llama a la API directamente responde 400 con errores por campo
  Y no se inserta ninguna fila en solicitudes, evidencias ni historial
```

### CA-4 — Archivo demasiado grande *(US-06)*
```gherkin
Dado un usuario en el formulario
Cuando selecciona un archivo .png de 10 MB
Entonces el componente muestra "El archivo excede los 5 MB permitidos" y deshabilita el envío
  Y si se llama a la API con ese archivo responde 413 y no se crea la solicitud
```

### CA-5 — Tipo de archivo no permitido o falsificado *(US-06)*
```gherkin
Dado un usuario que adjunta "virus.exe" o un ejecutable renombrado como "foto.jpg"
Cuando envía el formulario
Entonces el servidor responde 415 (o 400 por firma inválida) con un mensaje claro
  Y no se crea la solicitud ni se guarda ningún archivo en disco
```

### CA-6 — Texto con HTML *(RN-18)*
```gherkin
Dado un usuario que escribe "<script>alert(1)</script>" en la descripción o el título
Cuando envía
Entonces el servidor responde 400 con errores.descripcion = "No se permiten etiquetas HTML en este campo"
  Y no se crea la solicitud
```

### CA-7 — El solicitante sale del token *(RN-16)*
```gherkin
Dado un estudiante A autenticado
Cuando envía una solicitud cuyo JSON incluye "idUsuario": <id del estudiante B>
Entonces el campo extra se rechaza o se ignora y la solicitud queda asociada al estudiante A
```

### CA-8 — Categoría o prioridad inactiva *(RN-14)*
```gherkin
Dado que la categoría "Pizarras" fue desactivada
Cuando se intenta registrar una solicitud con esa categoría (llamada directa a la API)
Entonces responde 400 y no se crea la solicitud
  Y la categoría ya no aparece en el desplegable del formulario
```

### CA-9 — Código único *(US-07, RN-01)*
```gherkin
Dado que existe SOL-2026-0001
Cuando se registra la siguiente solicitud del año
Entonces su código es SOL-2026-0002 (correlativo anual, sin repetirse)
```

### CA-10 — Cálculo del SLA *(RN-09)*
```gherkin
Dado una categoría con SLA de 48 horas y una prioridad ALTA con SLA de 24 horas
Cuando se registra la solicitud
Entonces fechaLimiteSla = fechaRegistro + 24 horas (el menor de ambos)
```

### CA-11 — Mis solicitudes *(US-21)*
```gherkin
Dado un estudiante con 25 solicitudes propias y otro estudiante con 10
Cuando consulta GET /api/v1/solicitudes/mis-solicitudes?page=0&size=20
Entonces recibe 20 elementos de los 25 propios (totalElements = 25) ordenados por fecha descendente
  Y ninguno pertenece al otro estudiante
  Y filtrar por estado=CERRADA devuelve solo las cerradas
  Y buscar por parte del código o título devuelve las coincidencias
```

### CA-12 — Detalle ajeno *(RN-16)*
```gherkin
Dado un estudiante A y una solicitud del estudiante B
Cuando A consulta GET /api/v1/solicitudes/{id de B} (o su historial o sus evidencias)
Entonces el servidor responde 404 Not Found
```

### CA-13 — Detalle con línea de tiempo *(US-21)*
```gherkin
Dado una solicitud propia en estado ASIGNADA
Cuando el estudiante abre su detalle
Entonces ve el estado actual, datos, evidencias y la línea de tiempo cronológica del historial
  Y solo ve los comentarios no privados
```

### CA-14 — *(retirado)*
*Cancelar una solicitud salió del alcance el 03/10/2026 (el enunciado define 6 estados y no incluye `CANCELADA`). La numeración CA se conserva.*

### CA-15 — Atomicidad del alta *(RNF-04)*
```gherkin
Dado que falla el guardado de un archivo o la escritura del historial durante el alta
Cuando se produce el error
Entonces la transacción se revierte, no queda solicitud huérfana y los archivos ya escritos se eliminan
```

---

## 5. Matriz de trazabilidad

| Criterio | Historia | Pruebas esperadas |
|:---|:---:|:---|
| CA-1, CA-2 | US-05/06/07 | `SolicitudServiceTest`, `SolicitudControllerTest#crear`, Bruno `02-registro` |
| CA-3, CA-6 | US-05 | `SolicitudSchema.test`, validadores, `SolicitudControllerTest#validacion` |
| CA-4, CA-5 | US-06 | `FileUploader.test`, `FileTypeValidatorTest`, `FileStorageServiceTest` |
| CA-7, CA-12 | RN-16 | `AutorizacionMatrizTest` |
| CA-8 | RN-14 | `SolicitudServiceTest#categoriaInactiva` |
| CA-9 | US-07 | `SolicitudServiceTest#generaCodigoUnico` |
| CA-10 | RN-09 | `SlaCalculatorTest` |
| CA-11, CA-13 | US-21 | `MisSolicitudesIT`, `SolicitudDetalle.test` |
| CA-15 | RNF-04 | `AltaTransaccionalIT` (TC-013) |
