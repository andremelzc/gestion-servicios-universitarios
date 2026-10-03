# Plan 05 — Diseño técnico de la Administración

> Contratos en [`docs/02-diseno/api-rest.md` §3.5–3.6](../../docs/02-diseno/api-rest.md#35-catálogos--areas-categorias-prioridades-estados) · tablas `areas`, `categorias`, `prioridades`, `estados_solicitud`, `usuarios`, `roles` en [Modelo de datos](../../docs/02-diseno/modelo-datos.md). Aquí solo el diseño de implementación.

## 1. Backend (paquetes `catalogo`, `usuario`)

### 1.1 Componentes

| Clase | Responsabilidad |
|:---|:---|
| `AreaService`, `CategoriaService`, `PrioridadService` | CRUD con **baja lógica**, validación de unicidad (sin distinguir mayúsculas), coherencia (área activa, SLA ≥ 1) y reactivación. |
| `EstadoService` | Solo `listar` y `actualizarPresentacion(codigo, nombreVisible, descripcion, colorHex)`; no expone alta ni baja. |
| `AdminUsuarioService` | Alta, edición (datos, rol, área), baja lógica y reactivación; aplica RN-21 y las protecciones del admin. |
| Controladores | `AreaController`, `CategoriaController`, `PrioridadController`, `EstadoController`, `AdminUsuariosController`, `RolController`. Escritura con `@PreAuthorize("hasRole('ADMIN')")`; lectura abierta a autenticados (solo activos). |
| DTO `record` | `…CrearRequest`, `…ActualizarRequest`, `…Response`; `Page<…>` para usuarios. |
| `CatalogoAbstractService<T>` *(opcional)* | Plantilla genérica de CRUD con baja lógica para no repetir código entre áreas/categorías/prioridades. |

### 1.2 Baja lógica
`DELETE /{id}` → servicio ejecuta `entidad.setActivo(false)` y guarda. Cualquier consulta de **catálogo para formularios** filtra `activo = true` (método `findAllByActivoTrue`). Las consultas **históricas** (detalle de solicitud, dashboard) hacen JOIN sin filtrar por `activo`, por lo que siguen mostrando categorías inactivas.

### 1.3 Reglas de integridad
| Regla | Implementación |
|:---|:---|
| Nombre único insensible a mayúsculas | `UNIQUE` en BD (collation `utf8mb4_unicode_ci` ya es insensible) + `existsByNombreIgnoreCase` para un mensaje claro (409) |
| No desactivar un área con usuarios activos | `usuarioRepository.countByAreaAndActivoTrue(area) > 0` → 409 |
| Coherencia rol–área (RN-21) | `AdminUsuarioService.validarRolArea(rol, idArea)` en alta y edición |
| Siempre un admin activo | `usuarioRepository.countByRolAndActivoTrue(ADMIN) <= 1` y se intenta desactivar/cambiar rol → 409 |
| No auto-desactivación | Comparar con `CurrentUser` → 409 |
| Cambios de SLA no son retroactivos | `fecha_limite_sla` se calcula **al registrar/evaluar**; no hay *trigger* ni *job* que lo reescriba |
| Correo del dominio y único | Mismo validador que el registro (`@DominioInstitucional`) |
| Contraseña inicial | Enviada por el admin en el alta, hasheada con BCrypt(12); nunca se devuelve ni se registra en logs. *(Evolución: forzar cambio en el primer login.)* |
| Edición de estado | `colorHex` validado con `^#[0-9A-Fa-f]{6}$` (también `CHECK` en BD) |

### 1.4 Auditoría
Cada operación de administración escribe un log `INFO` con actor, entidad e id (sin datos sensibles) y, para cambios de rol/activación, un evento de seguridad `WARN` ([Observabilidad §3.3](../../docs/03-calidad-y-operacion/observabilidad.md#33-niveles-y-qué-registrar)).

---

## 2. Frontend (feature `admin`)

### 2.1 Hook genérico `useCrud`
Evita duplicar lógica entre pantallas:
```javascript
const { data, page, isLoading, error, create, update, deactivate, reactivate, refetch } =
  useCrud('/categorias', { includeInactive, search, page });
```
Maneja paginación, búsqueda con *debounce*, estados de carga/error, y actualiza la lista tras cada operación; traduce errores 400/409 de RFC 7807 a mensajes por campo.

### 2.2 Pantallas y componentes

| Elemento | Detalle |
|:---|:---|
| `AdminLayout` + rutas `/admin/*` protegidas con `RoleRoute allowedRoles={['ADMIN']}` | Menú lateral: Usuarios · Áreas · Categorías · Prioridades · Estados |
| `DataTable.jsx` | Tabla paginada/ordenable; en móvil se muestra como tarjetas; columna "Estado" (Activa/Inactiva) con texto e icono |
| `CategoriasAdminPage`, `AreasAdminPage`, `PrioridadesAdminPage`, `UsuariosAdminPage` | Listado + búsqueda + filtro "Mostrar inactivas" + botón "Nuevo" |
| `EstadosAdminPage` | Sin botón "Nuevo" ni "Eliminar"; edición de nombre visible, descripción y color (selector con vista previa de la insignia y **aviso de contraste**) |
| `*FormModal.jsx` | Formulario en modal con validación (Zod) y errores por campo del backend; `Esc` cierra; foco atrapado |
| `ConfirmDialog.jsx` | Confirmación de desactivación con el texto de [UX §9](../../docs/01-definicion/ux-ui-prototipo.md#9-microcopy-mensajes-de-la-interfaz); **no** usa `window.confirm` (accesibilidad y pruebas) |
| `UsuarioFormModal` | El selector de **área** se muestra y es obligatorio solo si el rol es `TECNICO`/`SUPERVISOR` (RN-21) |

### 2.3 Consumo en otros módulos
- Formulario de nueva solicitud: `GET /categorias` y `/prioridades` (solo activas).
- Dashboard y detalle: usan `estados` para nombre visible y color.
- Se invalida la caché de catálogos del cliente tras cualquier cambio del admin (React Query o un contexto con `refetch`).

## 3. Riesgos y controles

| Riesgo | Control |
|:---|:---|
| Perder trazabilidad por borrado físico | Baja lógica obligatoria; no hay `DELETE` SQL sobre catálogos |
| Quedarse sin administradores | Regla de "último admin" |
| Escalada de privilegios | Solo `ADMIN` escribe; el rol no se acepta del cliente en el registro público |
| Cambios de SLA que alteran el histórico | No retroactivos |
| Rotura del workflow por editar estados | Los códigos son inmutables; solo presentación |

## 4. Plan de pruebas
Trazabilidad en [`01-spec.md` §5](01-spec.md#5-matriz-de-trazabilidad); casos TC-026, TC-027, escenario UAT-09.
