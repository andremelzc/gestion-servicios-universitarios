# Evaluación heurística y prueba informal — Fase I (UX-07)

> **Issue:** #49 · **Responsable:** R5 · **Límite:** 11/10 · **Aceptación:** notas en el [informe de la Fase I](../05-entregables/informes-y-sustentacion.md#7-informe-de-la-fase-i--análisis-especificación-y-prototipo).
> **Método:** [UX §7.1 Heurísticas de Nielsen](ux-ui-prototipo.md#71-heurísticas-de-nielsen-revisión-de-expertos-antes-de-las-pruebas-con-usuarios) y [UX §7.2 Pruebas con usuarios](ux-ui-prototipo.md#72-pruebas-con-usuarios). Este documento solo registra **resultados**: el método está en UX §7 (ADR-010).

---

## 1. Objeto evaluado

Maqueta HTML/CSS/JS de la Fase I (`frontend-prototipo/`, #47).

```bash
cd frontend-prototipo && npm ci && npm start   # http://localhost:3000
```

| Para revisar… | Usar |
|:---|:---|
| Entrar con un rol sin pasar por el login | `?demo=estudiante` · `?demo=tecnico` · `?demo=supervisor` · `?demo=admin` |
| Estado de carga | `?delay=2000` |
| Estado vacío | `?vacio=1` |
| Mensajes de error | `?mock=400` · `401` · `403` · `404` · `409` · `429` · `500` |

**Pantallas clave (4):**

| Id | Pantalla | Wireframe | URL |
|:-:|:---|:-:|:---|
| P1 | Inicio de sesión | W-01 | `/login.html` |
| P2 | Nueva solicitud | W-03 | `/nueva-solicitud.html?demo=estudiante` |
| P3 | Bandeja del supervisor | W-06 | `/bandeja.html?demo=supervisor` |
| P4 | Dashboard | W-08 | `/dashboard.html?demo=supervisor` |

Revisar cada pantalla **a 375 px (móvil) y en escritorio**.

---

## 2. Revisión heurística individual

**Escala (UX §7.1):** 0 = sin problema · 1 = cosmético · 2 = menor · 3 = mayor · 4 = catastrófico.
Toda nota ≥ 1 debe tener al menos un hallazgo en la §3.

### 2.1 Evaluador: R5 — Andre Cuenca · Fecha: ____ · Navegador/dispositivo: ____

| # | Heurística | Qué mirar en la maqueta | P1 | P2 | P3 | P4 |
|:-:|:---|:---|:-:|:-:|:-:|:-:|
| 1 | Visibilidad del estado del sistema | Indicador de envío del login; confirmación con código `SOL-…`; *skeleton* con `?delay`; estado de cada solicitud visible | | | | |
| 2 | Coincidencia con el mundo real | Vocabulario de la universidad (campus, pabellón, aula) frente a jerga técnica; nombres de estados y prioridades | | | | |
| 3 | Control y libertad del usuario | "Cancelar" en el formulario; cerrar sesión; menú móvil que se cierra con `Esc`; borrador conservado | | | | |
| 4 | Consistencia y estándares | Mismos colores de estado en bandeja y dashboard; botones y etiquetas iguales entre pantallas | | | | |
| 5 | Prevención de errores | Validación en vivo; contador de descripción; límites de archivo (3 · 5 MB · JPG/PNG/PDF) avisados antes de enviar | | | | |
| 6 | Reconocer antes que recordar | Listas desplegables de categoría y prioridad; filtros visibles; etiquetas siempre visibles (no solo *placeholder*) | | | | |
| 7 | Flexibilidad y eficiencia | Pestañas de la bandeja; filtros en vivo; acceso directo a "Nueva solicitud" | | | | |
| 8 | Diseño estético y minimalista | Jerarquía clara; sin información de más; densidad del dashboard a 375 px | | | | |
| 9 | Reconocer y recuperar errores | Mensajes de `?mock=400/409/429/500`: ¿dicen qué pasó y qué hacer? ¿El 500 muestra el código de seguimiento? | | | | |
| 10 | Ayuda y documentación | Textos de ayuda en campos (descripción, evidencias); qué falta para la Fase II | | | | |
| | **Total por pantalla** (máx. 40) | | | | | |

### 2.2 Resto del equipo — *pendiente (requiere a los demás integrantes)*

> UX §7.1 pide que **cada integrante** puntúe. Copiar la tabla 2.1 por evaluador o consolidar aquí el promedio por heurística y pantalla.

| Evaluador | P1 | P2 | P3 | P4 | Fecha |
|:---|:-:|:-:|:-:|:-:|:-:|
| R5 — Andre Cuenca | | | | | |
| *(pendiente)* | | | | | |

---

## 3. Hallazgos

Severidad según UX §7.2: **cosmético / menor / mayor / bloqueante**. Los *mayores* y *bloqueantes* se corrigen antes del *Release Candidate*.

| N° | Heurística | Pantalla | Severidad | Descripción y evidencia (captura o pasos) | Acción propuesta | Estado / issue |
|:-:|:-:|:-:|:-:|:---|:---|:---|
| H-01 | | | | | | |
| H-02 | | | | | | |
| H-03 | | | | | | |

---

## 4. Prueba informal con 2 personas ajenas — *pendiente (requiere otras personas)*

> Preparado para ejecutarlo. Método reducido de UX §7.2: pensar en voz alta, sin ayuda salvo bloqueo, 10–15 min por persona.

**Texto de consentimiento (leer antes de empezar):**
"Estamos probando un prototipo de un sistema universitario. Evaluamos el sistema, no a ti: si algo no se entiende, el problema es del diseño. Te pediremos que pienses en voz alta. No registramos datos personales; puedes parar cuando quieras."

**Tareas** (subconjunto de UX §7.2 que la maqueta permite; no dar instrucciones de clics):

| # | Tarea | Inicio | Éxito si… | Meta |
|:-:|:---|:---|:---|:-:|
| T1 | "Se dañó el proyector de tu aula. Repórtalo con una foto." | `/login.html` (cuenta `juan@universidad.edu`, ver README de la maqueta) | Ve la confirmación con código `SOL-…` | ≤ 2 min |
| T2 | "Averigua en qué estado está tu reporte." | Continúa desde T1 | Encuentra el estado en "Mis solicitudes" | ≤ 30 s |
| T3 | *(supervisor)* "¿Cuántas solicitudes por asignar hay?" | `/bandeja.html?demo=supervisor` | Lee el dato correcto | ≤ 30 s |
| T5 | *(supervisor)* "¿Cuántas solicitudes vencidas hay?" | `/dashboard.html?demo=supervisor` | Lee el KPI correcto | ≤ 30 s |

**Resultados:**

| Persona | Perfil (sin datos personales) | T1 | T2 | T3 | T5 | Observaciones (citas textuales, dudas, errores) |
|:-:|:---|:-:|:-:|:-:|:-:|:---|
| A | | ✔/✘ · tiempo | | | | |
| B | | | | | | |

Los problemas observados se agregan a la §3 como hallazgos.

---

## 5. Ajustes realizados

| Hallazgo | Cambio | PR |
|:-:|:---|:-:|
| | | |

---

## 6. Resumen para el informe de la Fase I

> Completar al cerrar las secciones 2–5 y pegar en el informe (§7 de *informes y sustentación*), enlazando este documento.

- **Evaluadores:** __ integrantes · **Personas ajenas:** __
- **Heurísticas peor puntuadas:** __
- **Hallazgos:** __ en total (__ mayores, __ bloqueantes); corregidos: __
- **Prueba informal:** éxito por tarea T1 __/2 · T2 __/2 · T3 __/2 · T5 __/2
- **Próximos pasos:** prueba formal con ≥ 5 personas y SUS ≥ 70 en la Fase IV (QA-21, R4).
