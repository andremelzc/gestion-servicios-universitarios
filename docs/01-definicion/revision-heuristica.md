# Revisión heurística de Nielsen y prueba informal — flujos clave del frontend (UX-07)

> **Issue:** #49 · **Responsable:** R5 (AndreCuenca17) · **Aceptación:** notas en el [informe de la Fase I](../05-entregables/informes-y-sustentacion.md#7-informe-de-la-fase-i--análisis-especificación-y-prototipo).
> **Método:** [UX §7.1](ux-ui-prototipo.md#71-heurísticas-de-nielsen-revisión-de-expertos-antes-de-las-pruebas-con-usuarios) (10 heurísticas, severidad 0–4) y [UX §7.2](ux-ui-prototipo.md#72-pruebas-con-usuarios) (tareas y SUS). Este documento solo registra **resultados**; el método vive en UX §7 ([ADR-010](../02-diseno/decisiones-arquitectura.md#adr-010--fuente-única-de-verdad-por-tema)).
> **Complemento:** la plantilla [evaluación heurística de la maqueta HTML](evaluacion-heuristica-fase-i.md) cubre el prototipo `frontend-prototipo/`; este documento cubre la aplicación React de `frontend/`.

> **Estado y límites de esta revisión (leer primero)**
>
> - La **revisión heurística (§2–§4) la hizo un asistente de IA (Claude Code) leyendo el código**, no personas usando la interfaz. **Está pendiente de validación por R5 (AndreCuenca17)**, que debe confirmarla o corregirla en el navegador antes de citarla como resultado del equipo. Cada nota enlaza evidencia en el código para poder verificarla.
> - **No se ejecutó la aplicación**: no hay observación a 375 px, ni lector de pantalla, ni medición de contraste. Lo que depende de verlo en pantalla se marca como "a verificar".
> - UX §7.1 pide que puntúe **cada integrante**. Aquí hay **un solo evaluador (IA)**; el resto del equipo está pendiente (§2.2).
> - La **prueba con 2 personas ajenas (§6) NO se ha realizado**. Solo está preparado el protocolo. Todos los campos de resultados están vacíos a propósito.

## 1. Alcance

Las 4 pantallas clave de UX §7.1, en su implementación React:

| Id | Flujo | Archivos principales |
|:-:|:---|:---|
| P1 | Iniciar sesión | `features/auth/pages/LoginPage.jsx`, `features/auth/schemas.js` |
| P2 | Registrar solicitud | `features/solicitudes/pages/NuevaSolicitudPage.jsx`, `features/solicitudes/schemas.js`, `features/solicitudes/components/FileUploader.jsx` |
| P3 | Asignar (bandeja del supervisor + `ModalAsignacion`) | `features/gestion/pages/BandejaSupervisorPage.jsx`, `features/gestion/components/ModalAsignacion.jsx` |
| P4 | Resolver (bandeja del técnico + `ModalResolucion`) | `features/gestion/pages/BandejaTecnicoPage.jsx`, `features/gestion/components/ModalResolucion.jsx` |

Transversales: `services/errores.js` (mensajes de error), `components/ui/DataTable.jsx`, `components/ui/Modal.jsx`. Las rutas son relativas a `frontend/src/`.

## 2. Revisión heurística

**Escala (UX §7.1):** 0 = sin problema · 1 = cosmético · 2 = menor · 3 = mayor · 4 = catastrófico.
Una celda `3→2` indica la nota antes y después del ajuste de §5.

### 2.1 Evaluador: asistente de IA (Claude Code) · 2026-11-07 · método: lectura del código — **pendiente de validación humana**

| # | Heurística | P1 Login | P2 Registrar | P3 Asignar | P4 Resolver |
|:-:|:---|:-:|:-:|:-:|:-:|
| 1 | Visibilidad del estado | 0 | 0 | 0 | 0 |
| 2 | Coincidencia con el mundo real | 0 | 0 | 1 | 1 |
| 3 | Control y libertad | 0 | 1 | 0 | 2 |
| 4 | Consistencia y estándares | 0 | 2 | 0 | 1 |
| 5 | Prevención de errores | 0 | 1 | 0 | 0 |
| 6 | Reconocer antes que recordar | 0 | 0 | 1 | 1 |
| 7 | Flexibilidad y eficiencia | 0 | 0 | 1 | 0 |
| 8 | Diseño estético y minimalista | 0 | 0 | 0 | 0 |
| 9 | Reconocer y recuperar errores | 3→2 | 3→2 | 3→2 | 3→2 |
| 10 | Ayuda y documentación | 0 | 2 | 0 | 0 |
| | **Total tras ajustes** (máx. 40) | **2** | **8** | **5** | **7** |

Toda nota ≥ 1 tiene su hallazgo en §3 (una celda en 0 significa que no se encontró problema leyendo el código, no que esté demostrado que no existe).

Lectura honesta: **no hay hallazgos catastróficos (4)** y hubo **uno mayor (3)**, ya corregido. El código está por encima de lo habitual en accesibilidad y validación (spinner con `aria-busy`, errores por campo con `aria-invalid`, límites de evidencias avisados antes de enviar, foco al primer error). Las notas más altas están en P2 (formulario con más campos, sin marcar obligatorios y sin ayuda contextual) y P4 (la pérdida del informe al cancelar).

### 2.2 Resto del equipo — pendiente

| Evaluador | P1 | P2 | P3 | P4 | Fecha |
|:---|:-:|:-:|:-:|:-:|:---|
| Asistente de IA (esta revisión) | 2 | 8 | 5 | 7 | 2026-11-07 |
| R5 — AndreCuenca17 (validación) | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar |
| Otros integrantes | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar |

## 3. Hallazgos

Orden por severidad. "Estado" distingue lo corregido en este PR de lo pendiente.

| N° | Heur. | Pantalla | Sev. | Evidencia | Acción recomendada | Estado |
|:-:|:-:|:-:|:-:|:---|:---|:---|
| H-01 | 9 (y 1) | P1–P4 | **3** | `services/errores.js:4` y `components/ui/DataTable.jsx:71` mostraban "Sin conexión. Revisa tu internet; **reintentaremos automáticamente**". No existe ningún reintento automático: `services/apiClient.js` lanza `{status: 0, sinConexion: true}` (l. 122) sin reintentar y `useBandeja` solo vuelve a pedir con `refetch()` manual. El usuario espera a que algo ocurra y nada ocurre. | Texto veraz: "Sin conexión. Revisa tu internet e inténtalo de nuevo." | **Corregido** (§5) |
| H-02 | 9 | P1–P4 | 2 | `services/errores.js:43-48`: un 5xx sin `traceId` muestra solo "Ocurrió un error inesperado." sin decir qué hacer. En P1 el 401 sí tiene mensaje propio (`LoginPage.jsx:23,115`). | Añadir "Inténtalo de nuevo en unos minutos." (requiere actualizar UX §9, que fija el texto). | Pendiente |
| H-03 | 3 | P4 | 2 | `ModalResolucion.jsx:132` ("Cancelar") y Esc (`Modal.jsx:98-101`) cierran sin avisar y se pierde el informe de hasta 2 000 caracteres; el propio JSDoc lo asume (l. 148: "no conserva borradores"). "Cancelar" está pegado a "Marcar resuelta". | Confirmar el descarte si hay texto, o conservar el borrador por solicitud (como hace P2 en `sessionStorage`). | Pendiente |
| H-04 | 4 | P2 / P4 | 2 | P4 marca obligatorios con `*` (`ModalResolucion.jsx:82,112`) sin leyenda; P2 tiene 6 campos obligatorios y **ninguno marcado** (`NuevaSolicitudPage.jsx:207-349`). | Un único criterio: marcar obligatorios en ambos con leyenda "* obligatorio" (o marcar los opcionales). | Pendiente |
| H-05 | 10 | P2 | 2 | Categoría y prioridad se eligen sin explicación (l. 228-273). El estudiante no sabe que el supervisor fija la prioridad definitiva (`ModalAsignacion.jsx:100`, "Prioridad definitiva"). | Texto de ayuda breve bajo "Prioridad" ("El supervisor la confirma al asignar"). Requiere copy aprobado. | Pendiente |
| H-06 | 6 | P3 / P4 | 1 | Ambos modales solo muestran el título (`ModalAsignacion.jsx:97`, `ModalResolucion.jsx:79`): quien asigna o resuelve no ve descripción ni ubicación sin cerrar el modal. | Mostrar ubicación y descripción en el modal (hay que confirmar que la fila las trae). | Pendiente |
| H-07 | 2 | P3 / P4 | 1 | Cabecera "SLA" (`BandejaSupervisorPage.jsx:168`, `BandejaTecnicoPage.jsx:120`) es jerga; el selector de técnico usa "Todas" (`BandejaSupervisorPage.jsx:46`, género incorrecto). | "Plazo" en la cabecera; "Todos" para técnicos. | Pendiente |
| H-08 | 5 | P2 | 1 | `maxLength` en la descripción (l. 330) corta en silencio un texto pegado; solo avisa el contador. | Aviso cuando se alcanza el límite. | Pendiente |
| H-09 | 7 | P3 | 1 | Los filtros viven en `useState` (`BandejaSupervisorPage.jsx:67`) y se pierden al recargar; UX §7.1 menciona "filtros guardados". | Persistir en la URL o en `sessionStorage`. | Pendiente |
| H-10 | — | P1 | 1 | El wireframe W-01 (UX §5) dibuja "¿Olvidaste tu contraseña?", pero la recuperación de contraseña se **retiró del alcance** (especificaciones, historial v2.1). La implementación es correcta; el wireframe está desactualizado. | Quitar la línea del wireframe W-01. | Pendiente (solo documentación) |
| H-11 | — | P2 | 1 | El borrador solo guarda texto; los archivos adjuntos se pierden al volver (`NuevaSolicitudPage.jsx:5-6`, decisión documentada). | Aceptable; avisar si se quiere. | Aceptado |

**Fuera de este repo:** `frontend-prototipo/js/lib/errors.js:19` conserva el mismo texto de H-01 (la maqueta HTML no se modificó).

**Aspectos verificados que están bien** (para que la nota no sea solo negativa): spinner y botón deshabilitado en el login (`LoginPage.jsx:186-189`); contador `n / 500 · mín. 15` (`NuevaSolicitudPage.jsx:341`); límites de evidencias visibles antes de elegir (`FileUploader.jsx:141-144`); técnicos inactivos o de otra área deshabilitados y rotulados en texto (`ModalAsignacion.jsx:23-35`); confirmación antes de cerrar una solicitud (`AccionesSolicitud`); mensaje de 409 que dice qué hacer (`errores.js:5`); aviso `aria-live` tras asignar o resolver.

## 4. Pendiente por severidad

- **Mayores (3):** ninguno abierto.
- **Menores (2):** H-02, H-03, H-04, H-05.
- **Cosméticos (1):** H-06 a H-11 (H-11 aceptado).
- **Verificar en navegador (no se pudo comprobar leyendo el código):** densidad de la bandeja a 375 px, tamaño táctil de "Cancelar" y "Marcar resuelta" en el modal, contraste de los avisos, y que un 413/415 del servidor sin `detail` no caiga en "Ocurrió un error inesperado." (`errores.js:50`).

## 5. Ajustes realizados

| Hallazgo | Cambio | Prueba |
|:-:|:---|:---|
| H-01 | Texto de "sin conexión" en `errores.js` y `DataTable.jsx`; UX §9 actualizado | Las 8 aserciones existentes (errores, login, registro, `DataTable`, dashboard, `WidgetEstado`) se cambiaron primero al texto nuevo y fallaron; pasan tras el cambio |

## 6. Prueba informal con 2 personas ajenas — **Pendiente de ejecutar**

> Nada de esta sección está ejecutado. No hay participantes, tiempos ni citas: no inventarlos.

### 6.1 Preparación

| Aspecto | Definición |
|:---|:---|
| Participantes | 2 personas **ajenas al equipo** (ideal: 1 estudiante y 1 persona de perfil administrativo o docente) |
| Ambiente | Staging con datos de demostración (o `npm run dev` con MSW) y cuentas de prueba de cada rol |
| Roles del equipo | 1 moderador (habla lo mínimo) y 1 observador (anota y cronometra) |
| Duración | 20–30 min por persona |
| Método | Pensar en voz alta; sin ayuda salvo bloqueo; no dar instrucciones de clics |

**Consentimiento (leer antes de empezar):**
"Estamos probando un sistema universitario. Evaluamos el sistema, no a ti: si algo no se entiende, el problema es del diseño. Te pediremos que pienses en voz alta. No registramos datos personales; solo anotamos qué haces y cuánto tardas. Puedes parar cuando quieras."

### 6.2 Tareas (UX §7.2)

| # | Rol / cuenta | Tarea (texto para leer) | Éxito si… | Meta |
|:-:|:---|:---|:---|:-:|
| T1 | Estudiante | "Se dañó el proyector de tu aula. Repórtalo con una foto." | Obtiene el código de solicitud | ≤ 2 min, ≤ 8 clics |
| T2 | Estudiante | "Averigua en qué estado está tu reporte." | Localiza estado e historial | ≤ 30 s |
| T3 | Supervisor | "Asigna la solicitud más urgente a un técnico." | Asigna correctamente | ≤ 1 min |
| T4 | Técnico | "Marca como resuelto lo que reparaste, con evidencia." | Estado *Resuelta* | ≤ 2 min |

### 6.3 Resultados por persona

Estado de cada tarea: Éxito / Éxito con ayuda / Fallo. Tiempo en segundos. Errores = clics o intentos equivocados.

**Persona A** — Perfil (sin datos personales): Pendiente de ejecutar · Fecha: Pendiente de ejecutar · Moderador/Observador: Pendiente de ejecutar

| Tarea | Estado | Tiempo | Clics | Errores | Observaciones (citas textuales) |
|:-:|:-:|:-:|:-:|:-:|:---|
| T1 | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar |
| T2 | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar |
| T3 | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar |
| T4 | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar |

**Persona B** — Perfil (sin datos personales): Pendiente de ejecutar · Fecha: Pendiente de ejecutar · Moderador/Observador: Pendiente de ejecutar

| Tarea | Estado | Tiempo | Clics | Errores | Observaciones (citas textuales) |
|:-:|:-:|:-:|:-:|:-:|:---|
| T1 | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar |
| T2 | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar |
| T3 | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar |
| T4 | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar |

**Métricas agregadas:** éxito por tarea T1 Pendiente de ejecutar · T2 Pendiente de ejecutar · T3 Pendiente de ejecutar · T4 Pendiente de ejecutar. Con 2 personas es una señal cualitativa, **no una medida estadística**.

### 6.4 Cuestionario SUS

Cada persona puntúa de 1 (muy en desacuerdo) a 5 (muy de acuerdo). Cálculo (UX §7.2): ítems impares `valor − 1`; pares `5 − valor`; suma × 2.5. Criterio de aceptación de la Fase IV: media ≥ 70. Con 2 personas solo es orientativo.

| # | Ítem | Persona A | Persona B |
|:-:|:---|:-:|:-:|
| 1 | Creo que me gustaría usar este sistema con frecuencia | Pendiente de ejecutar | Pendiente de ejecutar |
| 2 | Encontré el sistema innecesariamente complejo | Pendiente de ejecutar | Pendiente de ejecutar |
| 3 | Pensé que el sistema era fácil de usar | Pendiente de ejecutar | Pendiente de ejecutar |
| 4 | Creo que necesitaría ayuda de una persona técnica para usarlo | Pendiente de ejecutar | Pendiente de ejecutar |
| 5 | Encontré las funciones del sistema bien integradas | Pendiente de ejecutar | Pendiente de ejecutar |
| 6 | Pensé que había demasiada inconsistencia en el sistema | Pendiente de ejecutar | Pendiente de ejecutar |
| 7 | Imagino que la mayoría de la gente aprendería a usarlo muy rápido | Pendiente de ejecutar | Pendiente de ejecutar |
| 8 | Encontré el sistema muy incómodo de usar | Pendiente de ejecutar | Pendiente de ejecutar |
| 9 | Me sentí muy seguro/a usando el sistema | Pendiente de ejecutar | Pendiente de ejecutar |
| 10 | Necesité aprender muchas cosas antes de poder usarlo | Pendiente de ejecutar | Pendiente de ejecutar |
| | **Puntuación SUS (0–100)** | Pendiente de ejecutar | Pendiente de ejecutar |

### 6.5 Hallazgos de la prueba

Se numeran `P-01…` y se añaden a la tabla de §3 con severidad (cosmético / menor / mayor / bloqueante). Los mayores y bloqueantes se corrigen antes del Release Candidate.

| N° | Persona / tarea | Severidad | Observación | Acción | Estado |
|:-:|:-:|:-:|:---|:---|:---|
| P-01 | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar | Pendiente de ejecutar |

## 7. Resumen para el informe de la Fase I

> Texto listo para pegar en [§7.2.3 UI/UX del informe](../05-entregables/informes-y-sustentacion.md#723-uiux). Completar las líneas pendientes solo tras la validación humana y la prueba.

- **Revisión heurística:** hecha con asistencia de IA sobre el código de los 4 flujos clave; 11 hallazgos (0 catastróficos, 1 mayor corregido, 4 menores, 6 cosméticos). **Validación de R5: Pendiente de ejecutar.**
- **Prueba informal con 2 personas ajenas:** Pendiente de ejecutar (protocolo listo en §6).
- **Próximo paso:** prueba formal con ≥ 5 personas y SUS ≥ 70 en la Fase IV (QA-21).
