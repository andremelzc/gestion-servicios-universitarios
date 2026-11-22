# Guía para agentes de IA — GISU

Este archivo define las reglas operativas que todo agente de IA (Claude Code, Codex, Antigravity IDE, Zed AI, OpenCode, Copilot, etc.) debe seguir al trabajar en este repositorio.

---

## 1. Registro obligatorio de uso de IA (avanzar el informe en cada tarea)

Cada vez que generes o modifiques código, pruebas, SQL, configuraciones, *workflows* o documentación con apoyo de IA, **debes registrar el uso antes de dar por terminada la tarea o abrir el PR**:

1. **Edita únicamente la bitácora del rol que está trabajando** en `docs/04-gestion/ia-registro/` (nunca modifiques los archivos de otros roles para evitar conflictos de *merge*):

   | Rol | Archivo personal | Prefijo `N°` |
   |:---|:---|:---:|
   | R1 · Tech Lead / Scrum Master | `docs/04-gestion/ia-registro/r1-tech-lead.md` | `R1-NN` |
   | R2 · Backend 1 | `docs/04-gestion/ia-registro/r2-backend-1.md` | `R2-NN` |
   | R3 · Backend 2 / DBA | `docs/04-gestion/ia-registro/r3-backend-2-dba.md` | `R3-NN` |
   | R4 · Frontend 1 | `docs/04-gestion/ia-registro/r4-frontend-1.md` | `R4-NN` |
   | R5 · Frontend 2 | `docs/04-gestion/ia-registro/r5-frontend-2.md` | `R5-NN` |
   | R6 · QA / DevOps / Seguridad | `docs/04-gestion/ia-registro/r6-qa-devops-seguridad.md` | `R6-NN` |

2. **Reglas de calidad de cada entrada** (fuente: `docs/04-gestion/ia-register.md`):
   - **Formato:** añade la fila al final de la tabla sin dejar líneas en blanco que rompan el Markdown, con correlativo `R<n>-NN` consecutivo y **sin duplicados**.
   - **Herramienta y modelo real:** indica la herramienta y el modelo exacto usado en la sesión.
   - **Prompt real (resumido) sin secretos:** jamás pegues contraseñas, `JWT_SECRET`, tokens, llaves ni datos personales reales.
   - **Columna `¿Se utilizó?`:** usa estrictamente **`Sí`**, **`Parcialmente`** o **`No`** (no uses variantes como `"Sí (parcialmente)"` ni dejes `"Pendiente"` al entregar).
   - **Columna `Validación realizada` concreta:** anota los comandos realmente ejecutados y sus resultados exactos (pruebas pasadas, falladas u omitidas, verificaciones en navegador/staging o revisión de seguridad). **Prohibido** escribir `"se revisó"` sin evidencia o reportar pruebas que no se ejecutaron.
   - **Columna `Modificaciones realizadas`:** registra los defectos detectados en la salida de la IA y los cambios aplicados (o `0` si no hubo).
   - **Trazabilidad en el PR:** enlaza el código `R<n>-NN` en la sección *Registro de Uso de IA* de `.github/pull_request_template.md`.

3. **Avance del informe y cierre de fase:**
   - Si la tarea aporta un aprendizaje relevante del rol o cierra un hito, actualiza también la sección del rol en `docs/05-entregables/lecciones-aprendidas.md`.
   - Para entregas formales, el registro unificado del grupo se forma uniendo `docs/04-gestion/ia-register.md` con las seis tablas en `docs/04-gestion/ia-registro/` (R1 → R6). Al consolidar o cerrar fase, sincroniza las tablas resumen de `docs/04-gestion/ia-register.md` (§6 y §7) con el conteo real de filas.

---

## 2. Flujo Git y convenciones del proyecto

- **Ramas y PRs:** crea ramas desde `develop` (`feature/*`, `fix/*`, `docs/*`) y abre los PR hacia **`develop`**, nunca directo a `main` (ver `docs/04-gestion/equipo-y-flujo-de-trabajo.md`).
- **Commits:** usa Conventional Commits en imperativo (`feat|fix|docs|test|ci|chore|perf|refactor(alcance): descripción`, máximo 72 caracteres en la primera línea, sin punto final) y referencia el issue (`Closes #<n>`).
- **Seguridad y arquitectura:** respeta los ADRs (`docs/02-diseno/decisiones-arquitectura.md`), las reglas OWASP (`docs/03-calidad-y-operacion/seguridad-owasp.md`) y la estrategia de pruebas (`docs/03-calidad-y-operacion/estrategia-pruebas.md`). Nunca introduzcas secretos, *hardcode* ni valores por defecto inseguros.
