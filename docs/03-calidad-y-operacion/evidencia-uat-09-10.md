# Evidencia de ejecución: UAT-09 y UAT-10 (QA-20, issue #181)

Resultados de la **segunda ejecución, sin adaptar el login** (la primera, del 2026-11-12, necesitó una adaptación por BUG-01; ver §2), **UAT-09** (administración de categorías, RF-09/RN-14) y **UAT-10** (dashboard del supervisor, RN-16) por la interfaz real, con capturas de cada paso. Las definiciones están en [`estrategia-pruebas.md`](estrategia-pruebas.md) (§ UAT) y los resultados que se daban por aprobados sin evidencia, en [`../INFORME_PRUEBAS.md`](../INFORME_PRUEBAS.md).

## 1. Entorno

| Elemento | Valor |
| --- | --- |
| Fecha de ejecución | 2026-11-13 (segunda ejecución, **sin adaptación del login**; la primera fue el 2026-11-12) |
| Entorno | **Docker Compose local** (`docker-compose.yml` + override de nombres de contenedor, proyecto aislado `uat181b`; puerto 8088 → Nginx; imágenes reconstruidas con `--build`) |
| Commit | `689a5f1` (`develop`, incluye el PR #396); el árbol solo añade esta evidencia |
| Backend | perfil `demo` (`DemoDataSeeder`: 200 solicitudes de demostración), `DEMO_MODO=normal`, zona horaria `America/Lima` |
| BD | MySQL 8.0 en volumen nuevo (reiniciado antes de la ejecución final para partir de datos limpios) |
| Navegador | Chromium (Playwright), 1280×800, un contexto de navegador por usuario |
| Usuarios | `admin.demo@`, `estudiante1.demo@`, `supervisor.demo@` (`@universidad.edu`); el supervisor pertenece al área *Tecnologías de la Información* |
| Guion | `ADAPTAR_LOGIN=0`: [`evidencias/uat/uat-09-10.spec.mjs`](evidencias/uat/uat-09-10.spec.mjs) (no es dependencia del proyecto; ver la cabecera para ejecutarlo) |

> **Por qué no es el «staging» de Vercel.** La URL de Vercel (`frontend-servicios-2o4nr29q3.vercel.app`) solo sirve el frontend estático: `/api/v1` responde 404 porque no hay backend desplegado. Un UAT necesita el sistema integrado, así que se usó Compose local, que el DoD del equipo acepta como alternativa a staging.

## 2. BUG-01 (login contra el backend real): resuelto en #396

| | |
| --- | --- |
| Historia | El 2026-11-12 `POST /auth/login` respondía un cuerpo plano `{token, tipo, correo, rol: "ROLE_X", idArea}` y el frontend esperaba `{token, usuario: {...}}` ([`api-rest.md` §3.1](../02-diseno/api-rest.md)): la UI volvía a `/login` sin mensaje y nadie podía entrar. Esa primera ejecución solo pudo avanzar adaptando la respuesta con un interceptor de Playwright. |
| Corrección | PR #396 «fix(auth): devolver perfil completo en la sesión». |
| Verificación (2026-11-13) | Con el commit `689a5f1`, `POST /auth/login` devuelve ahora `usuario: {id, nombre, apellido, correo, rol: "SUPERVISOR", idArea}` (además de los campos planos anteriores) y el guion con `ADAPTAR_LOGIN=0` inicia sesión por la UI con admin, estudiante y supervisor. |
| Captura histórica | ![Login sin sesión (fallo previo a #396)](evidencias/uat/00-bug01-login-sin-sesion.png) *Captura del 2026-11-12, antes de la corrección; se conserva solo como referencia.* |
| `GET /auth/me` | **Sigue sin existir y devuelve 500** (verificado con un JWT válido): Spring lanza `NoResourceFoundException` y `GlobalExceptionHandler` lo traduce a 500 en lugar de 404. Ningún flujo de la UI lo usa. Pendiente de issue. |

Nota de entorno: la primera prueba de esta ejecución falló con 403 en el login desde el navegador porque `ALLOWED_ORIGINS` del backend no incluía `http://localhost:8088` (CORS). No es un fallo del producto: se configuró `ALLOWED_ORIGINS=http://localhost:8088` y se repitió desde cero.

## 3. UAT-09 — Categoría «Pizarras Interactivas»

Criterio: el administrador crea la categoría y el estudiante la ve en el formulario; al desactivarla desaparece del formulario y las solicitudes existentes conservan el nombre histórico.

| # | Paso | Esperado | Obtenido | Estado |
| --- | --- | --- | --- | --- |
| 0 | Login de admin y estudiante | Sesión iniciada | Sesión iniciada por la UI sin adaptación (BUG-01 resuelto, §2) | ✅ |
| 1 | Admin abre *Administración de categorías* | Listado con 6 categorías activas | Electricidad, Equipos de Cómputo, Limpieza e Higiene, Mobiliario, Redes y Wi-Fi, Soporte de Software | ✅ |
| 2 | Admin crea «Pizarras Interactivas» (área TI, SLA 24 h) | Aviso de creación y fila nueva | Aviso «Categoría «Pizarras Interactivas» creada.» y fila *Activa* | ✅ |
| 3 | Estudiante abre *Nueva solicitud* | La categoría aparece en el selector | Opciones: las 6 anteriores **más** «Pizarras Interactivas» | ✅ |
| 4 | Estudiante registra una solicitud con esa categoría | Solicitud registrada | `SOL-2026-0201` registrada | ✅ |
| 5 | Admin desactiva la categoría (con confirmación) | Aviso de baja; la categoría queda *Inactiva* | Diálogo «Los registros existentes no se modifican.» y aviso de desactivación | ✅ |
| 6 | Estudiante vuelve a *Nueva solicitud* | La categoría ya no se ofrece | Opciones: las 6 originales; «Pizarras Interactivas» ausente | ✅ |
| 7 | Estudiante abre el detalle de `SOL-2026-0201` | Conserva «Pizarras Interactivas» (RN-14) | Detalle: *Categoría: Pizarras Interactivas*, área TI | ✅ |

Capturas:

| Paso | Captura |
| --- | --- |
| 1 | ![](evidencias/uat/09-01-admin-listado-categorias.png) |
| 2 (formulario) | ![](evidencias/uat/09-02-admin-formulario-nueva-categoria.png) |
| 2 (creada) | ![](evidencias/uat/09-03-admin-categoria-creada.png) |
| 3 | ![](evidencias/uat/09-04-estudiante-formulario-con-categoria.png) |
| 4 | ![](evidencias/uat/09-05-estudiante-solicitud-registrada.png) |
| 5 (confirmación) | ![](evidencias/uat/09-06-admin-confirmar-desactivacion.png) |
| 5 (desactivada) | ![](evidencias/uat/09-07-admin-categoria-desactivada.png) |
| 6 | ![](evidencias/uat/09-08-estudiante-formulario-sin-categoria.png) |
| 7 | ![](evidencias/uat/09-09-estudiante-detalle-conserva-categoria.png) |

Nota: en las capturas 3 y 6 el selector se despliega como lista (`size`) solo para que la captura muestre todas las opciones; el contenido es el del formulario real.

## 4. UAT-10 — Dashboard del supervisor

Criterio: el supervisor revisa el dashboard filtrado por fechas; las cifras son coherentes con la bandeja y solo ve su área.

**Rango usado:** del 01/01/2026 al 14/11/2026 (contiene todos los datos de demostración; el 14/11 es la fecha en UTC del equipo al ejecutar, la primera ejecución usó 13/11). Las cifras coinciden con las de la primera ejecución. Sin filtro, el dashboard muestra los últimos 30 días (42 solicitudes).

| # | Paso | Esperado | Obtenido | Estado |
| --- | --- | --- | --- | --- |
| 0 | Login del supervisor | Sesión iniciada | Sesión iniciada por la UI sin adaptación (BUG-01 resuelto, §2) | ✅ |
| 1 | Abrir *Dashboard* sin filtro | «Mostrando: últimos 30 días» | Registradas 42, Pendientes 42, Vencidas 39 | ✅ |
| 2 | Filtrar Desde 01/01/2026, Hasta 14/11/2026 y *Aplicar* | Rango visible y cifras recalculadas | «Mostrando: del 01/01/2026 al 14/11/2026»; Registradas 102, Pendientes 102, Atendidas 0, Vencidas 99 | ✅ |
| 3 | Bandeja → *Todas* | Total igual a *Registradas* | **102 registros** | ✅ |
| 4 | Bandeja por pestañas | Suma = *Pendientes*; *Resueltas* = *Atendidas* | Por asignar 69 + En curso 33 = **102**; Resueltas **0** | ✅ |
| 5 | Bandeja → *Todas* + «Solo vencidas» | Igual a *Vencidas* | **99 registros** | ✅ |
| 6 | Gráfico «por estado» vs. bandeja | Registrada + En evaluación = Por asignar; Asignada = En curso | 35 + 34 = 69; 33 | ✅ |
| 7 | Gráfico «por categoría» | Solo categorías de TI (sin Mantenimiento ni Servicios) | Equipos de Cómputo 33, Pizarras Interactivas 1, Redes y Wi-Fi 34, Soporte de Software 34 (= 102) | ✅ |
| 8 | Contraste de alcance: admin con el mismo rango | El admin ve más que el supervisor | Admin, todas las áreas: **201**; admin, área TI: **102** (= supervisor) | ✅ |
| 9 | MTTR del periodo | Cifra del periodo filtrado (INFORME_PRUEBAS) | «—», sin solicitudes resueltas en el área TI de la demo: **no se pudo comprobar** | ⚠️ |
| 10 | Comparar bandeja y dashboard **por fechas** | Misma ventana en ambos | La bandeja no tiene filtro de fechas; solo se pudo comparar con un rango que abarca todo | ⚠️ |

Capturas:

| Paso | Captura |
| --- | --- |
| 1 | ![](evidencias/uat/10-01-supervisor-dashboard-sin-filtro.png) |
| 2, 6, 7 | ![](evidencias/uat/10-02-supervisor-dashboard-filtrado-por-fechas.png) |
| 3 (Todas) | ![](evidencias/uat/10-03-supervisor-bandeja-todas.png) |
| 4 (Por asignar) | ![](evidencias/uat/10-03-supervisor-bandeja-porAsignar.png) |
| 4 (En curso) | ![](evidencias/uat/10-03-supervisor-bandeja-enCurso.png) |
| 4 (Resueltas) | ![](evidencias/uat/10-03-supervisor-bandeja-resueltas.png) |
| 5 | ![](evidencias/uat/10-04-supervisor-bandeja-solo-vencidas.png) |
| 8 (admin, todas las áreas) | ![](evidencias/uat/10-05-admin-dashboard-todas-las-areas.png) |
| 8 (admin, área TI) | ![](evidencias/uat/10-06-admin-dashboard-area-ti.png) |

## 5. Observaciones adicionales

| Id | Observación | Gravedad |
| --- | --- | --- |
| OBS-02 | El filtro de categoría de la bandeja del supervisor no ofrece «Pizarras Interactivas» tras desactivarla, aunque `SOL-2026-0201` la usa (el catálogo solo trae activas). Ya anotado en R5-23. | Baja |
| OBS-03 | Nginx limita `/auth/login` a 10 peticiones/min **sin ráfaga** (`limit_req … nodelay`): dos logins en menos de 6 s dan 429 con página HTML. Es el CA-9 del diseño, pero el guion tuvo que espaciar los logins; el frontend no muestra un mensaje específico para ese 429. | Baja |
| OBS-04 | El contenedor `frontend` queda `unhealthy` aunque sirve la aplicación (el healthcheck `wget http://localhost:80/` sale con 1). No se investigó la causa. | Baja |
| OBS-05 | El admin ve «Atendidas 66» pero «MTTR —, sin solicitudes resueltas». No se investigó si es un dato de la demo o una discrepancia de cálculo. | Por verificar |

## 6. Resultado final

| UAT | Resultado | Detalle |
| --- | --- | --- |
| **UAT-09** | ✅ **Aprobado** | Los 7 pasos de negocio y el login pasan por la UI real, **sin adaptar ninguna respuesta**; RN-14 se cumple (la categoría desaparece del formulario y la solicitud existente, `SOL-2026-0201`, conserva el nombre). |
| **UAT-10** | ✅ **Aprobado en lo funcional**, ⚠️ con reservas | Cifras del dashboard coherentes con la bandeja y acotadas al área (RN-16), idénticas a la primera ejecución. Reservas: el MTTR del periodo sigue sin poder comprobarse (paso 9: la demo no tiene solicitudes resueltas en TI) y la bandeja no permite contrastar por fechas (paso 10). |
| Precondición | ✅ BUG-01 resuelto (#396) | El login por la UI funciona con el stack real. Queda `GET /auth/me` → 500 (§2), que no bloquea estos UAT. |

Limitaciones: dos ejecuciones, un navegador (Chromium), datos de demostración y entorno local, no staging real; no se midió accesibilidad ni rendimiento. UAT-01 a UAT-08 no se repitieron.
