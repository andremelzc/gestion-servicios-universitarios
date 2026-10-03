# Tareas 08 — Entregables, UX/UI, Registro de IA y Release

> Tareas de planificación: **TASK-003** (Figma), **TASK-026** (informe Fase I), **TASK-033** (maqueta), **TASK-014** (informe Fase II), **TASK-022** (manuales), **TASK-037** (informe de pruebas), **TASK-023** (release), **TASK-038** (ensayo), **TASK-024** (sustentación). Marcar `[x]` solo al cumplir la [DoD](../../docs/04-gestion/equipo-y-flujo-de-trabajo.md#4-definición-de-hecho-dod).

## Fase 1 — UX/UI y prototipo (Fase I) · R4 / R5

| ☐ | # | Tarea | TS | Rol | Evidencia |
|:-:|:-:|:---|:---:|:---:|:---|
| [x] | 1.1 | Wireframes de baja fidelidad de las pantallas clave | TS-11 | R4/R5 | [UX §5](../../docs/01-definicion/ux-ui-prototipo.md#5-wireframes-de-baja-fidelidad) *(hecho en la documentación)* |
| [ ] | 1.2 | Biblioteca de estilos y componentes en Figma (colores, tipografía, componentes de [UX §2](../../docs/01-definicion/ux-ui-prototipo.md#2-sistema-de-diseño)) | TS-11 | R4 | Enlace Figma |
| [ ] | 1.3 | Mockups de alta fidelidad (W-01…W-09) en móvil y escritorio, con estados cargando/vacío/error | TS-11 | R4 | Enlace Figma (CA-6) |
| [ ] | 1.4 | Prototipo clicable de los flujos de registro y de asignación/resolución | TS-11 | R4 | CA-7 (prueba con persona ajena) |
| [ ] | 1.5 | `tokens.css` con las variables del sistema de diseño y *reset* base | TS-11 | R4 | Archivo en `frontend/src/styles/` |
| [ ] | 1.6 | **Maqueta HTML/CSS/JS** (login, nueva solicitud, listados, dashboard) con `fetch` a `mock/*.json` (json-server) | TS-11 | R5 | CA-8; capturas/GIF |
| [ ] | 1.7 | Verificación de contraste y tamaños táctiles en los mockups | TS-11 | R4 | Revisión con herramienta |
| [ ] | 1.8 | Revisión heurística (Nielsen) y prueba informal con 2 personas ajenas; ajustes | TS-11 | R4/R5 | Notas en el informe de Fase I |

## Fase 2 — Registro de IA (transversal) · todos

| ☐ | # | Tarea | TS | Rol | Evidencia |
|:-:|:-:|:---|:---:|:---:|:---|
| [x] | 2.1 | `docs/04-gestion/ia-register.md` con la tabla de campos exigidos, reglas y entradas reales separadas de los ejemplos | TS-10 | R6 | [Registro de IA](../../docs/04-gestion/ia-register.md) |
| [ ] | 2.2 | Sesión de equipo para acordar la regla "todo uso significativo de IA se registra de inmediato" y revisar [§3](../../docs/04-gestion/ia-register.md#3-criterios-de-aceptación-del-uso-de-ia) | TS-10 | R1 | Acta breve |
| [ ] | 2.3 | Agregar "¿Se usó IA? N° de entrada" a la revisión de cada PR | TS-10 | R1 | Plantilla de PR |
| [ ] | 2.4 | **Auditoría semanal** del registro (cada semana, hasta la semana 12) | TS-10 | R6 | Nota en la *review* |
| [ ] | 2.5 | Lecciones aprendidas (proyecto y uso de IA) | TS-10 | Todos | [§10](../../docs/04-gestion/ia-register.md#10-reflexión-final-se-completa-en-la-fase-iv) completada |

## Fase 3 — Informes de hito · R1

| ☐ | # | Tarea | TS | Rol | Evidencia |
|:-:|:-:|:---|:---:|:---:|:---|
| [ ] | 3.1 | **Informe de Fase I** (PDF) a partir del [índice](../../docs/05-entregables/informes-y-sustentacion.md#7-informe-de-la-fase-i--análisis-especificación-y-prototipo); completar puntos 10–12 con enlaces y capturas | TS-12 | R1 | Primera parte del informe de la Fase 1 (antes del 17/10) |
| [ ] | 3.2 | **Informe de la Fase 1 (I + II)** según la [plantilla](../../docs/05-entregables/informes-y-sustentacion.md#2-plantilla-del-informe-de-la-fase-1) y tag `v0.5.0-mvp` | TS-12 | R1 | Listo para la presentación del 17/10 |
| [ ] | 3.3 | Notas de versión de `v0.9.0-rc.1` | TS-12 | R1 | Release en GitHub |

## Fase 4 — Documentación final (Fase IV) · R1 / R4 / R6

| ☐ | # | Tarea | TS | Rol | Evidencia |
|:-:|:-:|:---|:---:|:---:|:---|
| [ ] | 4.1 | **Manual de usuario** con capturas de la aplicación desplegada (4 roles) | TS-12 | R4 + R1 | `MANUAL_USUARIO.pdf` (CA-10) |
| [ ] | 4.2 | **Manual técnico** que consolida y enlaza las fuentes + guía de instalación | TS-12 | R1 | `MANUAL_TECNICO.md` (CA-11) |
| [ ] | 4.3 | **Informe de pruebas** | TS-12 | R6 | `INFORME_PRUEBAS` (CA-12) |

## Fase 5 — Release y sustentación (semana 12, 14/11) · todos

| ☐ | # | Tarea | TS | Rol | Evidencia |
|:-:|:-:|:---|:---:|:---:|:---|
| [ ] | 5.1 | Completar el [checklist de release](../../docs/05-entregables/informes-y-sustentacion.md#4-checklist-de-release-y-revisión-final): arquitectura, código, patrones, *hardcode*, secretos, errores, documentación, escenarios, IA | TS-12 | Todos | Checklist con enlaces (CA-14) |
| [ ] | 5.2 | Verificar el ciclo Especificar → … → Mejorar con evidencia enlazada | TS-12 | R1 | Tabla del [Calendario §6](../../docs/04-gestion/calendario-y-contingencia.md#6-cumplimiento-del-ciclo-exigido) |
| [ ] | 5.3 | Congelar código, regresión final y tag `v1.0.0` | TS-12 | Todos | Release (TASK-023) |
| [ ] | 5.4 | Preparar el ambiente de demo: *seed* reproducible | TS-12 | R6 | [Checklist §5.3](../../docs/05-entregables/informes-y-sustentacion.md#53-preparación-del-ambiente-de-demo-checklist) |
| [ ] | 5.5 | Preparar presentación y guion; asignar intervenciones a cada integrante | TS-12 | R1 | Guion |
| [ ] | 5.6 | **Ensayo general** cronometrado con preguntas de alguien ajeno (incluye simulacro de "preguntas cruzadas" sobre código con IA) | TS-12 | Todos | Acta del ensayo (TASK-038) |
| [ ] | 5.7 | Subir informe final al Classroom y realizar la **sustentación** | TS-12 | Todos | TASK-024 |
