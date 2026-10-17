# Maqueta HTML/CSS/JS con API simulada (TASK-033 · UX-05)

Maqueta funcional en **HTML + CSS + JavaScript vanilla** (módulos ES, `async/await`, `fetch`) que valida el diseño de
[`docs/01-definicion/ux-ui-prototipo.md`](../docs/01-definicion/ux-ui-prototipo.md) §6.2 antes de construir la app React.
Cumple **CA-8** ([`specs/08-entregables-ia/01-spec.md`](../specs/08-entregables-ia/01-spec.md)). Es independiente de `frontend/`.

## Cómo ejecutarla

```bash
cd frontend-prototipo
npm ci          # solo json-server (devDependency, 0.17.4: compatible con Node >= 12)
npm start       # http://localhost:3000   (PORT=3100 npm start para otro puerto)
npm test        # node --test (Node >= 20, sin dependencias extra)
```

`npm start` ejecuta `server.js`: sirve las páginas estáticas y la API simulada en `/api/v1` (mismo origen, así
cumple la CSP `connect-src 'self'` de [seguridad-owasp.md](../docs/03-calidad-y-operacion/seguridad-owasp.md)).
Los datos viven **en memoria**; reiniciar el servidor restaura `mock/db.json`.

### Cuentas de demostración (contraseña `Demo1234`)

| Rol | Correo | Entra a |
|:---|:---|:---|
| Estudiante | `juan@universidad.edu` (también `camila@…` sin solicitudes, `diego@…`) | `mis-solicitudes.html` |
| Técnico | `carlos@universidad.edu` | `bandeja.html` |
| Supervisor | `ana@universidad.edu` | `bandeja.html` (pestaña "Por asignar") |
| Admin | `marco@universidad.edu` | `dashboard.html` |

Son datos ficticios solo de la maqueta; los usuarios reales los crea el `DemoDataSeeder` del backend.

### Atajos solo de la maqueta

| Parámetro | Efecto |
|:---|:---|
| `?demo=estudiante\|estudiante-nuevo\|tecnico\|supervisor\|admin` | Abre una sesión de demostración (sin pasar por el login) y quita el parámetro de la URL. Lo resuelve `GET /api/v1/mock/sesion/:alias`, que **no existe** en la API real. |
| `?mock=400\|401\|403\|404\|409\|429\|500` | Cada petición de la página falla con ese error RFC 7807 (cabecera `X-Mock-Status`). Sirve para ver el estado de error con reintento y `traceId`. Con prefijo `post:` (`?mock=post:409`) solo fallan las escrituras. |
| `?delay=3000` | Retraso en ms (máx. 5000) para ver el esqueleto de carga (`X-Mock-Delay`). |
| `?vacio=1` | Las listas llegan vacías (`X-Mock-Empty`). |

Ejemplo: `http://localhost:3000/bandeja.html?demo=supervisor&mock=500`.

## Pantallas (wireframes de UX §5)

| Archivo | Wireframe | Qué demuestra |
|:---|:---|:---|
| `login.html` | W-01 | Constraint Validation API (`setCustomValidity`), mensajes del microcopy, spinner, redirección por rol (UX §4.1), 401/400 |
| `registro.html` | W-02 | Checklist de contraseña en vivo, correo institucional, 400/409 |
| `nueva-solicitud.html` | W-03 | Catálogos desde la API, contador de caracteres, `FileReader` (vista previa), límites 3 archivos / 5 MB / JPG-PNG-PDF, `FormData` multipart, confirmación `SOL-AAAA-NNNN`, 400/409, borrador en `sessionStorage` |
| `mis-solicitudes.html` | W-04 | Tarjetas (móvil) → tabla (≥ 768 px), filtros en vivo (búsqueda, estado, prioridad), paginación, estados vacío/error/carga |
| `bandeja.html` | W-06 / W-07 (listado) | Igual que el anterior + pestañas por grupo de estado y técnico/SLA |
| `dashboard.html` | W-08 | KPIs desde JSON, dona SVG y barras CSS con `role="img"` + `aria-label` + tabla "Ver datos" |

No se construyeron (fuera del alcance de TASK-033): detalle con línea de tiempo (W-05), modal de asignar/resolver, administración (W-09) y perfil (W-10).
Los botones de acción de la bandeja tampoco existen: la maqueta solo lista.

Todas las pantallas implementan los estados de UX §2.5: carga (esqueleto), vacío (con llamada a la acción), error
(con reintento y código de soporte), éxito y sin permiso (redirige al inicio del rol; el dashboard responde 403 al estudiante).

## Estructura

```
frontend-prototipo/
├── *.html                 una página por pantalla (CSP por <meta>, sin scripts ni estilos inline)
├── css/tokens.css         variables del sistema de diseño (UX §2)
├── css/index.css          único CSS, mobile-first (breakpoints 768 / 1024), Flexbox + Grid
├── js/lib/                lógica pura, SIN DOM, con pruebas: validation, errors, filters, format, session, roles
├── js/{api,auth,forms,lista,shell,ui}.js   fetch, sesión, validación de formularios, listado, cascarón, helpers DOM
├── js/pages/              un módulo por pantalla
├── mock/db.json           datos semilla (catálogos de modelo-datos.md §4, solicitudes, KPIs)
├── mock/handlers.js       login/registro/POST solicitudes/RFC 7807 (puro y probado)
├── mock/routes.js         lecturas con RBAC y alcance por rol (puro y probado)
├── server.js              json-server + middlewares + estáticos
├── scripts/capturar.mjs   capturas y verificación de scroll horizontal (Chrome por CDP)
├── test/                  node --test
└── evidencias/            capturas 375×667 y 1920×1080 + informe de scroll
```

## Cómo se simulan los errores (api-rest.md §1.2)

| Código | Cómo se produce |
|:---|:---|
| **400** | `POST /auth/login`, `/auth/registro` y `POST /solicitudes` validan en `mock/handlers.js` con las mismas reglas que el cliente (y comprueban que categoría, prioridad y campus existan y estén activos) y devuelven `errores: { campo: mensaje }`. El cliente lo pinta junto a cada campo. |
| **401** | Credenciales incorrectas en login (mismo mensaje para correo inexistente o clave errónea); también cualquier ruta sin `Authorization: Bearer mock.<id>` (el cliente limpia la sesión y vuelve a `login.html?expirada=1`). |
| **409** | Registrar un correo ya existente (api-rest.md §3.1). La transición inválida (`409`, microcopy de UX §9) se demuestra con `?mock=post:409` (falla solo las escrituras) o `?mock=409` (todas las peticiones). |
| 403 / 404 / 415 / 429 / 500 | `?mock=<código>` o rutas reales: el estudiante en `/solicitudes` y `/dashboard/*` recibe 403; una solicitud fuera de su alcance es 404 (RN-16); `POST /solicitudes` que no es `multipart/form-data` es 415; cualquier ruta no documentada es 404 problem+json. |

Contratos: campos en `camelCase`, `Page<SolicitudResumen>` en los listados, `SolicitudResumen`, respuesta de login con `token/tipo/expiraEn/usuario`,
`POST /solicitudes` multipart (parte JSON `solicitud` + `archivos`), catálogos y `/dashboard/*` según `docs/02-diseno/api-rest.md`.
El token simulado es `mock.<idUsuario>` (no es un JWT).

## Decisiones

- **Rutas explícitas, sin router genérico:** `json-server` aporta el servidor Express y el *body parser*; las lecturas pasan por `mock/routes.js` (puro y probado), que aplica el RBAC y el alcance RN-16 y responde 404 problem+json a todo lo no documentado. No se expone `db.json` (ni usuarios ni contraseñas).
- **Solo `127.0.0.1`:** el servidor escucha únicamente en loopback porque incluye el endpoint de demostración `mock/sesion`.

- **Sesión:** `localStorage`, clave `gestion_univ_auth` (ADR-004), siempre en `try/catch`; botón "Cerrar sesión" la borra.
- **Seguridad:** nunca `innerHTML` con datos (solo `textContent`/`createElement`); CSP del doc sin `unsafe-inline` (por eso los colores dinámicos se asignan con CSSOM y no con atributos `style`).
- **Tipografía:** `Inter` con la pila de reserva del doc. **No se carga ninguna fuente** (la CSP solo permite `font-src 'self'` y no se versionan binarios); si Inter está instalada se usa, si no, la fuente del sistema. Para empaquetarla bastaría añadir un `@font-face` con un `.woff2` local.
- **Filtros en vivo:** se descarga la lista (`size=100`) y se filtra en el cliente; la API real también filtra en servidor (`estado`, `idPrioridad`, `q`), algo que la maqueta no necesita.
- **Alcance de rol en el mock:** técnico → sus asignadas, supervisor → su área, admin → todas; los KPIs del dashboard son los mismos para todos los roles.
- **Campus:** el wireframe W-03 lo muestra como lista; la API lo define como texto libre, así que el mock expone `GET /campus` (no es un endpoint real).
- Fuera de alcance: rango de fechas del dashboard, "¿Olvidaste tu contraseña?", modo oscuro.

## Pruebas

`npm test` ejecuta `node --test` sobre la lógica pura (validación, normalización de errores, filtros, formato/KPIs, sesión, roles) y los handlers del mock.

## Evidencia (CA-8)

`evidencias/` contiene las capturas de cada pantalla y estado a **375×667** y **1920×1080**, y `verificacion-scroll-horizontal.txt`.
Regenerarlas (Chrome instalado y Node ≥ 22 por el `WebSocket` global; el script arranca su propio servidor y lo reinicia en cada captura, así cada pantalla parte de los datos semilla):

```bash
npm run evidencias
```

El script abre Chrome sin interfaz por CDP, aplica el tamaño de pantalla, siembra la sesión con `?demo=`, mide
`document.documentElement.scrollWidth <= clientWidth` (sin scroll horizontal) en 360/375/768/1024/1440/1920 px y guarda las capturas.
