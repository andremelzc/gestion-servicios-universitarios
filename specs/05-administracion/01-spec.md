# Spec 05 — Administración (Catálogos y Usuarios)

## 1. Ficha

| Campo | Valor |
|:---|:---|
| **Épica** | E5 — Administración de catálogos y usuarios |
| **Historia (HU)** | HU-06 Gestión de usuarios, roles y catálogos |
| **Historias divididas (US)** | US-15, US-16, US-17, US-31, US-32, US-33, US-34 |
| **Requerimientos** | RF-09, RF-10 · RN-14, RN-21, RN-22 |
| **Roles afectados** | `ADMIN` (acceso total). Lecturas de catálogos activos: todos los autenticados |
| **Prioridad** | **Must** |
| **Dependencias** | Autenticación (spec 01) · Datos maestros `V2` · Contrato [API §3.5–3.6](../../docs/02-diseno/api-rest.md#35-catálogos--areas-categorias-prioridades-estados) · Plan: [`02-plan.md`](02-plan.md) · Tareas: [`03-tasks.md`](03-tasks.md) |
| **Fuera de alcance** | Crear o eliminar **estados** y editar transiciones ([ADR-009](../../docs/02-diseno/decisiones-arquitectura.md#adr-009--los-estados-son-un-catálogo-de-presentación-no-de-comportamiento)); importación masiva de usuarios; gestión de permisos granulares |

**Objetivo:** que el administrador mantenga vivos los catálogos del sistema (áreas, categorías con SLA, prioridades con SLA, presentación de estados) y los usuarios con sus roles, **sin tocar la base de datos**, respetando la integridad histórica mediante **baja lógica**.

> **Nota sobre Estados:** el enunciado pide administrar "Estados". Como el flujo de negocio depende de sus códigos, el administrador puede **editar su presentación** (nombre visible, descripción, color) pero no crear, borrar ni renombrar los códigos.

---

## 2. Historias de usuario

| ID | Historia | Validaciones | Prio. |
|:---|:---|:---|:---:|
| **US-15** | Como administrador, quiero **crear, editar y desactivar categorías** de solicitud. | Nombre único (≤ 80); SLA ≥ 1 h; desactivar = baja lógica. | M |
| **US-16** | Como administrador, quiero **vincular una categoría a un área** (ej. Redes → TI). | Área obligatoria, existente y activa. | M |
| **US-17** | Como administrador, quiero **gestionar el rol de los usuarios** (ej. promover un estudiante a técnico). | Selector de rol; si es `TECNICO`/`SUPERVISOR`, el **área es obligatoria**; si es `ESTUDIANTE`/`ADMIN`, no admite área (RN-21). | M |
| **US-31** | Como administrador, quiero **administrar prioridades y sus SLA**. | `nivel` único; `slaMaxHoras` ≥ 1; baja lógica; los cambios afectan solo solicitudes **nuevas**. | M |
| **US-32** | Como administrador, quiero **personalizar la presentación de los estados**. | Solo `nombreVisible` (≤ 40), `descripcion` (≤ 255) y `colorHex` (`#RRGGBB`); sin crear/borrar. | M |
| **US-33** | Como administrador, quiero **gestionar las áreas responsables**. | Nombre único; correo de contacto válido; baja lógica; no se desactiva un área con usuarios activos. | M |
| **US-34** | Como administrador, quiero **crear, editar, desactivar y reactivar usuarios**. | Correo único y del dominio institucional; rol y área coherentes; no puede desactivarse a sí mismo ni al último admin. | M |

---

## 3. Reglas aplicables
- **RN-14 (baja lógica generalizada):** ningún registro de `usuarios`, `areas`, `categorias`, `prioridades` se borra físicamente. `DELETE /…/{id}` ejecuta `UPDATE activo = false`.
- **Ocultamiento dinámico (RF-09):** los catálogos inactivos **no aparecen** en los formularios, pero siguen visibles en solicitudes históricas.
- **RN-21:** coherencia rol–área. **RN-22:** al desactivar un usuario se corta su acceso en la siguiente petición.
- **Protección del sistema:** siempre debe quedar al menos **un administrador activo**.

---

## 4. Criterios de aceptación (BDD)

### Categorías y áreas

#### CA-1 — Crear una categoría y verla en el formulario *(US-15, US-16)*
```gherkin
Dado un administrador autenticado en "Administración › Categorías"
Cuando crea la categoría "Conectividad Wi-Fi" asociada al área "Tecnologías de la Información" con SLA de 24 horas
Entonces el servidor responde 201 Created con el objeto de la categoría
  Y queda registrada en MySQL con activo = true
  Y un estudiante que abre "Nueva solicitud" la ve de inmediato en la lista desplegable
```

#### CA-2 — Nombre duplicado o datos inválidos *(US-15)*
```gherkin
Cuando el administrador crea una categoría con un nombre que ya existe (sin distinguir mayúsculas), o sin área, o con SLA 0
Entonces responde 409 (duplicado) o 400 (validación) y no se crea nada
```

#### CA-3 — Baja lógica de una categoría *(US-15, RN-14)*
```gherkin
Dado un administrador en el panel de Categorías y la categoría "Pizarras" (id 5) con 3 solicitudes históricas
Cuando hace clic en "Desactivar" y confirma
Entonces el backend recibe DELETE /api/v1/categorias/5 y responde 204 No Content
  Y en la BD se ejecuta UPDATE categorias SET activo = false WHERE id = 5 (la fila NO se borra)
  Y un estudiante que abre "Nueva solicitud" ya no ve "Pizarras"
  Y las 3 solicitudes históricas siguen mostrando la categoría "Pizarras"
```

#### CA-4 — Reactivar *(US-15)*
```gherkin
Dado una categoría inactiva
Cuando el administrador ejecuta PUT /api/v1/categorias/{id}/reactivar
Entonces activo = true y vuelve a aparecer en el formulario de nuevas solicitudes
```

#### CA-5 — Gestión de áreas *(US-33)*
```gherkin
Cuando el administrador crea el área "Seguridad y Vigilancia" con correo de contacto válido
Entonces queda disponible para asociar categorías y usuarios
```
```gherkin
Dado un área con técnicos o supervisores activos
Cuando el administrador intenta desactivarla
Entonces responde 409 con el detalle ("Reasigne o desactive los usuarios del área primero")
```
```gherkin
Dado un área inactiva
Entonces no aparece como opción al crear categorías ni usuarios
```

### Prioridades y estados

#### CA-6 — Modificar el SLA de una prioridad *(US-31)*
```gherkin
Dado la prioridad ALTA con SLA de 24 horas y 5 solicitudes abiertas con prioridad ALTA
Cuando el administrador cambia el SLA a 12 horas
Entonces las solicitudes NUEVAS con prioridad ALTA usan 12 horas en el cálculo de fecha_limite_sla
  Y las 5 solicitudes existentes conservan su fecha_limite_sla (no se reescribe el pasado)
```

#### CA-7 — Presentación de estados *(US-32)*
```gherkin
Dado el estado "EN_EVALUACION" con nombre visible "En evaluación"
Cuando el administrador lo cambia a "En revisión" y el color a "#D97706" con PUT /api/v1/estados/EN_EVALUACION
Entonces la interfaz muestra "En revisión" en todas las pantallas y gráficos
  Y el código EN_EVALUACION y las transiciones no cambian
```
```gherkin
Cuando se intenta POST o DELETE sobre /api/v1/estados, o se envía un colorHex inválido ("rojo")
Entonces responde 405/404 (no existe esa operación) o 400 respectivamente
```

### Usuarios y roles

#### CA-8 — Promover a técnico exige área *(US-17, RN-21)*
```gherkin
Dado un usuario con rol ESTUDIANTE
Cuando el administrador cambia su rol a TECNICO sin indicar área
Entonces responde 400 con errores.idArea
```
```gherkin
Cuando lo cambia a TECNICO con área "Tecnologías de la Información"
Entonces el usuario queda con ese rol y área y aparece en GET /usuarios/tecnicos del área TI
```
```gherkin
Cuando se intenta asignar un área a un usuario con rol ESTUDIANTE o ADMIN
Entonces responde 400
```

#### CA-9 — Crear usuario *(US-34)*
```gherkin
Cuando el administrador crea un usuario con correo "lucia@universidad.edu", rol SUPERVISOR y área TI
Entonces responde 201 y la contraseña queda hasheada con BCrypt (nunca se devuelve)
```
```gherkin
Cuando el correo ya existe o no pertenece al dominio institucional
Entonces responde 409 o 400 respectivamente
```

#### CA-10 — Desactivar un usuario *(US-34, RN-22)*
```gherkin
Dado un técnico activo con sesión abierta
Cuando el administrador lo desactiva con DELETE /api/v1/admin/usuarios/{id}
Entonces responde 204 con activo = false
  Y su siguiente petición con el token vigente responde 401
  Y sus solicitudes asignadas y su historial permanecen intactos
  Y deja de aparecer en la lista de técnicos asignables
```

#### CA-11 — Protecciones del administrador *(US-34)*
```gherkin
Dado un administrador autenticado
Cuando intenta desactivarse a sí mismo
Entonces responde 409
```
```gherkin
Dado que solo existe un administrador activo
Cuando alguien intenta desactivarlo o cambiarle el rol
Entonces responde 409 y el administrador sigue activo
```

#### CA-12 — *(retirado)*
*El desbloqueo manual de cuentas salió del alcance el 03/10/2026 junto con el bloqueo por intentos. La numeración CA se conserva.*

### Autorización y presentación

#### CA-13 — Solo el administrador escribe *(todos)*
```gherkin
Dado un usuario con rol SUPERVISOR, TECNICO o ESTUDIANTE
Cuando intenta POST/PUT/DELETE en /areas, /categorias, /prioridades, /estados o cualquier ruta /admin/**
Entonces responde 403
  Y las pantallas de administración no aparecen en su menú
```
```gherkin
Dado cualquier usuario autenticado
Cuando consulta GET /categorias o /prioridades
Entonces recibe solo registros activos (el parámetro incluirInactivos solo lo respeta ADMIN)
```

#### CA-14 — Tablas paginadas y confirmación *(US-15…US-34)*
```gherkin
Dado un listado de administración con más de 20 registros
Entonces se muestra paginado (20 por página) con búsqueda y filtro "Mostrar inactivas"
  Y toda desactivación pide confirmación explicando que "los registros existentes no se modifican"
```

---

## 5. Matriz de trazabilidad

| Criterio | Historia | Pruebas esperadas |
|:---|:---:|:---|
| CA-1, CA-2, CA-3, CA-4 | US-15/16 | `CategoriaServiceTest`, `CategoriaControllerTest`, `BajaLogicaIT` (TC-026) |
| CA-5 | US-33 | `AreaServiceTest` |
| CA-6 | US-31 | `PrioridadServiceTest`, `SlaCalculatorTest` |
| CA-7 | US-32 | `EstadoControllerTest` |
| CA-8, CA-9, CA-10, CA-11 | US-17/34 | `AdminUsuarioServiceTest`, `AdminUsuariosControllerTest` (TC-027) |
| CA-13 | RBAC | `AutorizacionMatrizTest` |
| CA-14 | UX | `DataTable.test`, UAT-09 |
