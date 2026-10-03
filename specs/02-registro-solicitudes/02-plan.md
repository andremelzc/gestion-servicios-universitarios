# Plan 02 — Diseño técnico del Registro de Solicitudes

> Contratos en [`docs/02-diseno/api-rest.md` §3.2](../../docs/02-diseno/api-rest.md#32-solicitudes--solicitudes) · tablas `solicitudes`, `evidencias_archivos`, `historial_solicitudes`, `secuencias_solicitud` en [`docs/02-diseno/modelo-datos.md`](../../docs/02-diseno/modelo-datos.md) · almacenamiento de archivos en [Arquitectura §5](../../docs/02-diseno/arquitectura-tecnica.md#5-almacenamiento-de-archivos).

## 1. Backend (paquetes `solicitud`, `evidencia`)

### 1.1 Componentes

| Clase | Responsabilidad |
|:---|:---|
| `Solicitud` (entidad) | Mapea `solicitudes`; relaciones `@ManyToOne(fetch = LAZY)` a usuario, categoría, prioridad, estado. **Nunca** se expone en la API. |
| `SolicitudController` | `POST /solicitudes` (multipart: partes `solicitud` y `archivos`), `GET /solicitudes/mis-solicitudes`, `GET /solicitudes/{id}`, `GET /{id}/historial`. |
| `SolicitudService` | `crear`, `listarMias`, `obtenerDetalle`; orquesta código, SLA, evidencias e historial en una transacción. |
| `CodigoSolicitudService` | Genera `SOL-AAAA-NNNN` ([ADR-011](../../docs/02-diseno/decisiones-arquitectura.md#adr-011--código-de-solicitud-correlativo-generado-en-base-de-datos)). |
| `SlaCalculator` | `calcularLimite(registro, prioridad, categoria)` = `registro + MIN(horas)` (RN-09). Función pura y probada. Recibe un `Clock`. |
| `FileStorageService` | Valida, guarda y elimina archivos; interfaz para poder migrar a S3/MinIO. |
| `FileTypeValidator` | Comprueba firma (*magic bytes*), extensión, `Content-Type` y tamaño. |
| `SolicitudSpecification` | Filtros dinámicos (estado, texto, fechas) para listados. |
| `AccessPolicy` | `puedeVer(usuario, solicitud)`; usada por todos los servicios (RN-16). |
| DTO | `SolicitudCrearRequest` (`record`, Bean Validation + `@SinHtml`), `SolicitudCreadaResponse`, `SolicitudResumen`, `SolicitudDetalle`, `HistorialItem`. |

### 1.2 Algoritmo de alta

```
@Transactional
crear(dto, archivos, usuario):
  validarArchivos(archivos)                       # antes de tocar la BD: tamaño, cantidad, firma
  categoria = categorias.getActiva(dto.idCategoria)   # 400 si no existe o inactiva
  prioridad = prioridades.getActiva(dto.idPrioridad)
  codigo    = codigoService.siguiente(anio(clock))     # incremento atómico sobre secuencias_solicitud
  limite    = slaCalculator.calcularLimite(ahora, prioridad, categoria)
  s = guardar(Solicitud{codigo, solicitante=usuario, ..., estado=REGISTRADA, fechaLimiteSla=limite})
  para cada archivo: rutas.add(storage.guardar(archivo))   # nombre UUID
  evidencias.guardarTodas(s, rutas, tipo=INICIAL)
  historial.registrar(s, usuario, null -> REGISTRADA)
  # compensación: si la transacción falla, un TransactionSynchronization elimina los archivos escritos
  return SolicitudCreadaResponse(s)
```

### 1.3 Generación del código
```
siguiente(anio):
  # UPDATE secuencias_solicitud SET ultimo_numero = LAST_INSERT_ID(ultimo_numero + 1) WHERE anio = ?
  # (si la fila del año no existe se inserta con INSERT ... ON DUPLICATE KEY UPDATE)
  return "SOL-%d-%04d".formatted(anio, ultimoNumero)
```
`UNIQUE(codigo)` en la tabla `solicitudes` es la red de seguridad final.

### 1.4 Validación de archivos
Orden: cantidad (≤ 3) → tamaño (≤ `MAX_FILE_SIZE_MB`) → extensión en lista blanca → **firma** (`FF D8 FF`, `89 50 4E 47 0D 0A 1A 0A`, `25 50 44 46`) → coincidencia extensión/firma/`Content-Type`. Fallo → 413 (tamaño), 415 (tipo) o 400 (firma). El nombre original se **sanea** (se recorta y se eliminan separadores de ruta) solo para mostrarlo; el almacenado es `UUID + extensión`.

### 1.5 Configuración
`spring.servlet.multipart.max-file-size=${MAX_FILE_SIZE_MB:5}MB` · `max-request-size=16MB` · `app.storage.path=${STORAGE_PATH}` (el servicio falla al arrancar si no es escribible).

### 1.6 Consultas
- `mis-solicitudes`: `Specification` por `id_usuario_solicitante = :usuario` + filtros; ordenado por `fecha_registro desc`; **proyección DTO** (no se cargan entidades completas) para evitar N+1; índice `idx_solicitudes_solicitante`.
- `detalle`: una consulta con `JOIN FETCH` de categoría/área/prioridad/estado/técnico y consultas separadas de evidencias y comentarios visibles al rol.

---

## 2. Frontend (feature `solicitudes`)

| Componente | Detalle |
|:---|:---|
| `NuevaSolicitudPage.jsx` | Formulario con Zod; carga de categorías y prioridades **activas** vía `GET /categorias` y `/prioridades`; contador de caracteres; **borrador en `sessionStorage`** (se limpia al enviar); envío con `FormData` (parte `solicitud` como `Blob` JSON `application/json` y partes `archivos`); estados *cargando/error*; tras el 201 navega a la confirmación. |
| `FileUploader.jsx` | *Drag & drop* + selector; valida `file.size ≤ 5 242 880`, tipos permitidos y máx. 3; vista previa de imágenes (`URL.createObjectURL`, liberada en *cleanup*); errores accesibles (`aria-live`). |
| `ConfirmacionSolicitudPage.jsx` | Muestra el código y enlaces a "Ver mi solicitud" / "Registrar otra". |
| `MisSolicitudesPage.jsx` | Tabla (escritorio) / tarjetas (móvil); filtros por estado y búsqueda con *debounce*; paginación; estado vacío. |
| `SolicitudDetallePage.jsx` | Datos, evidencias, **`Timeline`**, comentarios y acciones según `accionesPermitidas`. |
| `EstadoBadge.jsx` | Texto + punto de color tomado de `estado.colorHex` ([UX §2.1](../../docs/01-definicion/ux-ui-prototipo.md#21-color)). |
| `useSolicitudes` / `useFetch` | Hook con `AbortController` para cancelar peticiones al desmontar. |

Descarga de evidencias: la UI llama al endpoint autenticado y abre el blob (no existe URL pública del archivo).

## 3. Seguridad y riesgos

| Riesgo | Control |
|:---|:---|
| IDOR | `AccessPolicy` + 404 |
| Archivos maliciosos | Firma, lista blanca, nombre aleatorio, almacenamiento fuera del *webroot*, `nosniff` |
| XSS almacenado | `@SinHtml` + escape en React |
| DoS por subidas | Límites de tamaño/cantidad en Nginx, Spring y servicio |
| Códigos duplicados | Secuencia anual con incremento atómico + `UNIQUE(codigo)` |
| Inconsistencia disco–BD | Compensación transaccional |

## 4. Plan de pruebas
Trazabilidad en [`01-spec.md` §5](01-spec.md#5-matriz-de-trazabilidad); casos TC-007…TC-013, TC-023 del [catálogo](../../docs/03-calidad-y-operacion/estrategia-pruebas.md#14-catálogo-de-casos-de-prueba-prioritarios); UAT-02 y UAT-03.
