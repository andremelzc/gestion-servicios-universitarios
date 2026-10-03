# Backlog 09 — UX/UI, Registro de IA, informes y entrega final

> Convenciones: [README](README.md). Fuente: [`specs/08-entregables-ia/03-tasks.md`](../../specs/08-entregables-ia/03-tasks.md) · [UX/UI](../01-definicion/ux-ui-prototipo.md) · [Registro de IA](../04-gestion/ia-register.md) · [Entregables y sustentación](../05-entregables/informes-y-sustentacion.md). TASK-003, 014, 022, 023, 024, 026, 033, 037, 038, 039. Los wireframes (tarea 1.1) ya están hechos en la documentación.

# Épica UX — Diseño y prototipo (Fase I)

### UX-01 · [UX] Diseño - Biblioteca de estilos y componentes en Figma
**Rol:** R4 · **Labels:** `ux` `TS-11` `TASK-003` · **Sprint:** S1 · **Milestone:** 1.1 Fundaciones técnicas · **Límite:** 06/10 · **Bloqueado por:** —
- [ ] Colores, tipografía y componentes del [sistema de diseño (UX §2)](../01-definicion/ux-ui-prototipo.md#2-sistema-de-diseño)

**Aceptación:** enlace de Figma.

### UX-02 · [UX] Diseño - Mockups de alta fidelidad W-01…W-09
**Rol:** R4 · **Labels:** `ux` `TS-11` `TASK-003` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** UX-01
- [ ] Móvil y escritorio, con estados cargando/vacío/error

**Aceptación:** enlace Figma (CA-6).

### UX-03 · [UX] Diseño - Prototipo clicable (registro y asignación/resolución)
**Rol:** R4 · **Labels:** `ux` `TS-11` `TASK-003` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** UX-02
- [ ] Flujo de registro de solicitud y flujo asignar → resolver

**Aceptación:** CA-7 (probado por una persona ajena).

### UX-04 · [UX] Frontend - `tokens.css` y *reset* base
**Rol:** R4 · **Labels:** `frontend` `ux` `TS-11` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** UX-01, BASE-04
- [ ] Variables CSS del sistema de diseño en `frontend/src/styles/`

**Aceptación:** archivo versionado y usado por los componentes.

### UX-05 · [UX] Frontend - Maqueta HTML/CSS/JS con `fetch` a `mock/*.json` (TASK-033)
**Rol:** R5 · **Labels:** `frontend` `ux` `TS-11` `TASK-033` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** UX-01 · **Mock:** json-server
- [ ] Login, nueva solicitud, listados y dashboard con JavaScript moderno (formularios, validaciones, eventos, DOM, `fetch`)
- [ ] Diseño responsive

**Aceptación:** CA-8; capturas o GIF.

### UX-06 · [UX] Diseño - Verificación de contraste y tamaños táctiles
**Rol:** R4 · **Labels:** `ux` `accesibilidad` `TS-11` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** UX-02

**Aceptación:** revisión con herramienta de contraste (WCAG AA).

### UX-07 · [UX] Diseño - Revisión heurística (Nielsen) y prueba informal con 2 personas
**Rol:** R5 · **Labels:** `ux` `TS-11` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** UX-03, UX-05
- [ ] Revisión heurística, prueba con 2 personas ajenas y ajustes

**Aceptación:** notas en el informe de Fase I.

### UX-08 · [UX] Diseño - Wireframes de baja fidelidad en Figma
**Rol:** R4 · **Labels:** `ux` `TS-11` `TASK-003` · **Sprint:** S1 · **Milestone:** 1.1 Fundaciones técnicas · **Límite:** 06/10 · **Bloqueado por:** — · **Bloquea:** UX-02
Los wireframes existen como texto en [UX §5](../01-definicion/ux-ui-prototipo.md#5-wireframes-de-baja-fidelidad); el enunciado pide wireframes como entregable visual de la Fase I.
- [ ] Trasladar a Figma los wireframes de las pantallas W-01…W-09 (baja fidelidad, móvil y escritorio)
- [ ] Verificar que cada pantalla cubra los criterios de aceptación de su historia
- [ ] Enlazar los frames desde el informe de Fase I (`DOC-01`)

**Aceptación:** enlace de Figma con las 9 pantallas.

### UX-09 · [UX] Frontend - Cookie de preferencias `gu_prefs` (tema y estado del menú)
**Rol:** R5 · **Labels:** `frontend` `ux` `TS-11` `ADR-004` · **Sprint:** S1 · **Milestone:** 1.4 Gestión backend y UI del flujo MVP · **Límite:** 14/10 · **Bloqueado por:** BASE-04, UX-04
La Fase II del enunciado incluye cookies; el [ADR-004](../02-diseno/decisiones-arquitectura.md#adr-004--jwt-de-8-horas-sin-refresh-token) define una cookie solo de preferencias no sensibles.
- [ ] Utilidad de cookies en el frontend (leer/escribir/borrar) con `SameSite=Lax; Secure; Max-Age=1 año`
- [ ] Guardar en `gu_prefs` el tema (claro/oscuro) y el estado del menú lateral
- [ ] Aplicar las preferencias al cargar la app, sin parpadeo
- [ ] Comprobar que **no** contiene token ni datos personales

**Aceptación:** prueba de componente y captura de la cookie en las herramientas del navegador; se cita en el informe de Fase II (`DOC-02`).

---

# Épica IA — Registro de uso de IA (transversal)

### IA-01 · [IA] Proceso - Sesión de equipo y acta de la regla de registro
**Rol:** R1 · **Labels:** `ia` `TS-10` · **Sprint:** S1 · **Milestone:** 1.1 Fundaciones técnicas · **Límite:** 06/10 · **Bloqueado por:** —
- [ ] Acordar "todo uso significativo de IA se registra de inmediato" y revisar los [criterios](../04-gestion/ia-register.md#3-criterios-de-aceptación-del-uso-de-ia)

**Aceptación:** acta breve.

### IA-02 · [IA] Proceso - "¿Se usó IA? N° de entrada" en la plantilla de PR
**Rol:** R1 · **Labels:** `ia` `devops` `TS-10` · **Sprint:** S1 · **Milestone:** 1.1 Fundaciones técnicas · **Límite:** 06/10 · **Bloqueado por:** BASE-02

**Aceptación:** plantilla de PR actualizada.

### IA-03 · [IA] Proceso - Auditoría semanal del registro (recurrente, hasta la semana 16)
**Rol:** R6 · **Labels:** `ia` `TS-10` · **Sprint:** recurrente · **Milestone:** 1.1 Fundaciones técnicas · **Límite:** 14/11 (recurrente) · **Bloqueado por:** IA-01
- [ ] Revisar semanalmente que las entradas tengan prompt, resultado, uso, validación, modificaciones y responsable

**Aceptación:** nota en la *review* de cada semana.

### IA-05 · [IA] Docs - Lecciones aprendidas (proyecto y uso de IA)
**Rol:** R1 (todos aportan) · **Labels:** `ia` `docs` `TS-10` · **Sprint:** S3 · **Milestone:** 2.7 Manuales y release v1.0.0 · **Límite:** 12/11 · **Bloqueado por:** IA-03
- [ ] Completar [§10](../04-gestion/ia-register.md#10-reflexión-final-se-completa-en-la-fase-iv) con el aporte de cada integrante
- [ ] Redactar la sección "Lecciones aprendidas" del informe final (paso 14 de la sustentación)

**Aceptación:** sección completa.

### IA-06 · [IA] Proceso - Registrar el uso de IA de cada módulo
**Rol:** R1 (cada integrante registra lo suyo) · **Labels:** `ia` `TS-10` · **Sprint:** recurrente · **Milestone:** 1.1 Fundaciones técnicas · **Límite:** 14/11 (recurrente) · **Bloqueado por:** IA-01
- [ ] Auth · [ ] Registro · [ ] Gestión (especialmente pruebas generadas) · [ ] Dashboard · [ ] Administración · [ ] DevOps (Dockerfiles, *workflows*, seguridad) · [ ] Observabilidad y pruebas · [ ] Notificaciones · [ ] Entregables
- [ ] Cada entrada incluye la validación realizada

**Aceptación:** entradas con validación; verificado por `IA-03`.

---

# Épica DOC — Informes, manuales y entrega

### DOC-01 · [Docs] Informe de la Fase I (primera parte del informe de la Fase 1) (TASK-026)
**Rol:** R1 · **Labels:** `docs` `TS-12` `TASK-026` · **Sprint:** S1 · **Milestone:** 1.5 Pruebas, E2E, informe y presentación de la Fase 1 · **Límite:** 16/10 · **Bloqueado por:** UX-03, UX-05
- [ ] Completar el [índice](../05-entregables/informes-y-sustentacion.md#7-informe-de-la-fase-i--análisis-especificación-y-prototipo): problema, justificación, usuarios, alcance, requerimientos, épicas, historias, criterios, arquitectura, wireframes/mockups, prototipo y evidencia del primer desarrollo (puntos 10–12 con enlaces y capturas)
- [ ] Dejarlo como primera parte del informe de la Fase 1 (se ensambla en `DOC-02`)

**Aceptación:** parte I del informe lista antes de la presentación del 17/10.

### DOC-02 · [Docs] Informe de la Fase 1 (fases I + II) y tag `v0.5.0-mvp` (TASK-014)
**Rol:** R1 · **Labels:** `docs` `release` `TS-12` `TASK-014` · **Sprint:** S1 · **Milestone:** 1.5 Pruebas, E2E, informe y presentación de la Fase 1 · **Límite:** 16/10 · **Bloqueado por:** QA-00
- [ ] Redactar según la [plantilla](../05-entregables/informes-y-sustentacion.md#2-plantilla-del-informe-de-la-fase-1), incluyendo estado (`localStorage`/`sessionStorage`) y cookies ([ADR-004](../02-diseno/decisiones-arquitectura.md#adr-004--jwt-de-8-horas-sin-refresh-token))
- [ ] Unir la parte I (`DOC-01`) con la parte II y crear el tag `v0.5.0-mvp`; subir al Classroom si se solicita

**Aceptación:** release en GitHub e informe de la Fase 1 completo para la presentación del **17/10**.

### DOC-03 · [Docs] Release Candidate `v0.9.0-rc.1` desplegado en *staging* (TASK-039)
**Rol:** R1 · **Labels:** `release` `TS-12` `TASK-039` · **Sprint:** S3 · **Milestone:** 2.4 Cloud, CD, hardening y Release Candidate · **Límite:** 04/11 · **Bloqueado por:** OPS-32, OPS-23, OPS-28
- [ ] Verificar 0 hallazgos críticos/altos de seguridad
- [ ] Notas de versión y tag `v0.9.0-rc.1`

**Aceptación:** release en GitHub con notas. **Bloquea:** QA-19…QA-21.

### DOC-04 · [Docs] Manual de usuario con capturas (4 roles)
**Rol:** R4 · **Labels:** `docs` `TS-12` `TASK-022` · **Sprint:** S3 · **Milestone:** 2.7 Manuales y release v1.0.0 · **Límite:** 12/11 · **Bloqueado por:** DOC-03
- [ ] Capturas de la aplicación desplegada: estudiante, técnico, supervisor y administrador

**Aceptación:** `MANUAL_USUARIO.pdf` (CA-10).

### DOC-05 · [Docs] Manual técnico y guía de instalación
**Rol:** R1 · **Labels:** `docs` `TS-12` `TASK-022` · **Sprint:** S3 · **Milestone:** 2.7 Manuales y release v1.0.0 · **Límite:** 12/11 · **Bloqueado por:** DOC-03
- [ ] Consolidar y enlazar las fuentes únicas; guía de despliegue y variables

**Aceptación:** `MANUAL_TECNICO.md` (CA-11).

### DOC-08 · [Docs] Checklist de release y revisión final
**Rol:** R1 (todos) · **Labels:** `docs` `calidad` `TS-12` · **Sprint:** S3 · **Milestone:** 2.7 Manuales y release v1.0.0 · **Límite:** 12/11 · **Bloqueado por:** QA-22, OPS-32
- [ ] Arquitectura, código, patrones de diseño, *hardcode*, secretos, manejo de errores, documentación, escenarios BDD e IA

**Aceptación:** checklist con enlaces (CA-14).

### DOC-09 · [Docs] Verificar el ciclo Especificar → … → Mejorar
**Rol:** R1 · **Labels:** `docs` `TS-12` · **Sprint:** S3 · **Milestone:** 2.7 Manuales y release v1.0.0 · **Límite:** 12/11 · **Bloqueado por:** DOC-08
- [ ] Completar la tabla del [Calendario §6](../04-gestion/calendario-y-contingencia.md#6-cumplimiento-del-ciclo-exigido) con evidencia enlazada para las 9 etapas

**Aceptación:** tabla con enlaces.

### DOC-10 · [Docs] Congelamiento, regresión final y tag `v1.0.0` (TASK-023)
**Rol:** R1 (todos) · **Labels:** `release` `TS-12` `TASK-023` · **Sprint:** S3 · **Milestone:** 2.7 Manuales y release v1.0.0 · **Límite:** 12/11 · **Bloqueado por:** QA-23, DOC-04, DOC-05, DOC-08
- [ ] Congelar código, regresión completa (Bruno + UAT críticos) y tag `v1.0.0` desplegado en producción

**Aceptación:** release `v1.0.0`.

### DOC-11 · [Docs] Ambiente de demo (seed reproducible)
**Rol:** R3 · **Labels:** `devops` `TS-12` `TASK-038` · **Sprint:** S3 · **Milestone:** 2.8 Ensayo y sustentación final · **Límite:** 14/11 · **Bloqueado por:** DOC-10
- [ ] Ver [checklist §5.3](../05-entregables/informes-y-sustentacion.md#53-preparación-del-ambiente-de-demo-checklist)

**Aceptación:** el ambiente de demo se recrea desde cero con el *seed* y queda limpio.

### DOC-12 · [Docs] Presentación y guion de la demostración
**Rol:** R4 · **Labels:** `docs` `TS-12` · **Sprint:** S3 · **Milestone:** 2.8 Ensayo y sustentación final · **Límite:** 14/11 · **Bloqueado por:** DOC-10
- [ ] Demostración integral (no solo diapositivas) con intervenciones asignadas a cada integrante
- [ ] Seguir la secuencia de 14 pasos del enunciado: Problema, Solución propuesta, Arquitectura, Historias de usuario, Demo Frontend, Demo Backend/API, Base de datos, Seguridad, Testing, CI/CD, Cloud, Observabilidad, Resultados y Lecciones aprendidas ([guion](../05-entregables/informes-y-sustentacion.md#51-secuencia-y-tiempos))

**Aceptación:** guion con tiempos.

### DOC-13 · [Docs] Ensayo general cronometrado (TASK-038)
**Rol:** R1 (todos) · **Labels:** `docs` `TS-12` `TASK-038` · **Sprint:** S3 · **Milestone:** 2.8 Ensayo y sustentación final · **Límite:** 14/11 · **Bloqueado por:** DOC-11, DOC-12
- [ ] Preguntas de alguien ajeno, incluyendo "preguntas cruzadas" sobre código generado con IA

**Aceptación:** acta del ensayo.


### DOC-15 · [Docs] Subir el informe final y sustentación (TASK-024)
**Rol:** R1 (equipo) · **Labels:** `docs` `release` `TS-12` `TASK-024` · **Sprint:** S3 · **Milestone:** 2.8 Ensayo y sustentación final · **Límite:** 14/11 · **Bloqueado por:** DOC-13, IA-05
- [ ] Subir el informe final al Classroom y realizar la sustentación

**Aceptación:** informe subido; demostración realizada (**14/11**, segunda y última presentación).

### DOC-16 · [Docs] Evidencias de la Fase III (Release Candidate)
**Rol:** R1 · **Labels:** `docs` `release` `TS-12` · **Sprint:** S3 · **Milestone:** 2.4 Cloud, CD, hardening y Release Candidate · **Límite:** 04/11 · **Bloqueado por:** DOC-03, OPS-34
El enunciado exige demostrar en la Fase III: aplicación desplegada, API documentada, CI/CD, autenticación, autorización, seguridad, pruebas y evidencias de automatización.
- [ ] Aplicación desplegada: URL de *staging* y captura
- [ ] API documentada: Swagger UI (dev/test) y `openapi.yaml`
- [ ] CI/CD: ejecuciones exitosas de `ci.yml`, `security.yml`, `cd-staging.yml`
- [ ] Autenticación y autorización: matriz de pruebas (`AUTH-21`, `GES-24`, `ADM-22`)
- [ ] Seguridad: checklist `OPS-32`, reportes de CodeQL/gitleaks/ZAP baseline
- [ ] Pruebas y automatización: cobertura JaCoCo/Vitest, colección Bruno en CI
- [ ] Carpeta/índice `docs/evidencias/fase-3/` con enlaces

**Aceptación:** índice de evidencias completo y enlazado en las notas de `v0.9.0-rc.1`.

### DOC-17 · [Docs] Presentación de la Fase 1 (fases I + II) y demostración del MVP
**Rol:** R4 · **Labels:** `docs` `MVP` `TS-12` · **Sprint:** S1 · **Milestone:** 1.5 Pruebas, E2E, informe y presentación de la Fase 1 · **Límite:** 17/10 · **Bloqueado por:** QA-00, DOC-02
Primera presentación del curso (semana 8, 17/10): cubre las Fases I y II del enunciado.
- [ ] Diapositivas: problema, usuarios, alcance, requerimientos, épicas/historias, arquitectura, wireframes/mockups y prototipo
- [ ] Demostración en vivo del MVP: Login → registrar solicitud → guardar en MySQL → consultar → modificar estado
- [ ] Asignar intervenciones a cada integrante y ensayar una vez
- [ ] Subir el informe de la Fase 1 al Classroom si se solicita

**Aceptación:** presentación realizada el 17/10 con demo sin fallos; el informe (`DOC-01` + `DOC-02`) está subido.
