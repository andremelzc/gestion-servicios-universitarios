# Registro de Uso de Inteligencia Artificial (IA)

> **Norma del proyecto (requisito transversal del enunciado):** cada grupo mantiene este registro. Sirve para demostrar que la IA se usó como **herramienta de ingeniería** (generar pruebas, revisar escenarios, proponer plantillas de código) y **no como sustituto del aprendizaje** ni del razonamiento técnico.
> Relacionados: [Estrategia de pruebas §10](../03-calidad-y-operacion/estrategia-pruebas.md#10-pruebas-con-apoyo-de-ia) · [Seguridad §11](../03-calidad-y-operacion/seguridad-owasp.md#11-seguridad-en-el-uso-de-ia) · [Gobernanza Git (PR)](equipo-y-flujo-de-trabajo.md#31-ciclo-de-vida)

---

## 1. ¿Qué se registra?

Se registra **todo uso significativo** de IA. Es *significativo* si el resultado se incorporó (total o parcialmente) o influyó en una decisión de **código, pruebas, arquitectura, especificación, documentación, seguridad o despliegue**.

| Se registra | No hace falta registrar |
|:---|:---|
| Código, consultas SQL, configuraciones, *workflows* generados o modificados con IA | Corrector ortográfico o autocompletado trivial de una línea |
| Pruebas generadas o escenarios BDD propuestos/revisados por IA | Preguntas puntuales de sintaxis cuyo resultado no se usa |
| Borradores de documentación, ADRs, planes o informes | Búsquedas de documentación sin generar contenido |
| Revisión de seguridad o de arquitectura asistida por IA | |
| Diseño (textos de interfaz, ideas de UX) generado con IA | |

**Regla de oro:** en la duda, se registra.

## 2. Campos del registro

Son los campos exigidos por el enunciado, más número y fecha para trazabilidad.

| Campo | Qué escribir |
|:---|:---|
| **N°** | Correlativo (01, 02, …) |
| **Herramienta** | Nombre y versión/modelo (Copilot, ChatGPT-4o, Claude…) |
| **Prompt** | El prompt **real** (resumido si es muy largo). **Sin secretos ni datos personales** |
| **Resultado generado** | Qué produjo: código, prueba, arquitectura, BDD, texto… |
| **¿Se utilizó?** | `Sí` · `No` · `Parcialmente` (indicar qué parte) |
| **Validación realizada** | Cómo se comprobó: ejecución de pruebas, revisión línea a línea, prueba manual, comparación con la documentación oficial, pasada de SAST… |
| **Modificaciones** | Qué se cambió respecto a lo generado (número y descripción) |
| **Responsable** | Rol e integrante que lo usó y responde por el resultado |
| **Fecha** | `AAAA-MM-DD` |

> *Una entrada sin validación concreta no es válida: "se revisó" no basta; debe indicar **qué** prueba o comprobación se hizo.*

---

## 3. Criterios de aceptación del uso de IA

1. **Comprensión absoluta:** nada generado por IA entra al repositorio si su autor no entiende cada línea y su impacto. En la sustentación cualquier integrante puede ser interrogado sobre cualquier parte.
2. **Prohibición de secretos y datos personales:** nunca incluir en prompts contraseñas, `JWT_SECRET`, tokens, claves, cadenas de conexión con credenciales ni datos personales reales.
3. **Validación obligatoria:** todo código generado debe pasar por pruebas (unitarias/integración) o una **validación funcional manual documentada** antes del PR; el código de IA se trata como código de un tercero no confiable (revisión de seguridad incluida).
4. **No se "hace pasar" una prueba** con IA ajustando la aserción sin entender la causa del fallo.
5. **Verificar dependencias y APIs sugeridas:** comprobar que existen y son las oficiales (la IA puede inventar paquetes o métodos).
6. **Coherencia con las decisiones del proyecto:** el resultado debe respetar los [ADRs](../02-diseno/decisiones-arquitectura.md) y la documentación fuente; si la contradice, se corrige el resultado.
7. **Honestidad:** el registro refleja lo que realmente ocurrió, incluidos fallos de la IA y correcciones. Es **evidencia de aprendizaje**, no de perfección.

## 4. Proceso y auditoría

| Cuándo | Qué | Quién |
|:---|:---|:---|
| Al usar IA | Registrar **inmediatamente** (no al final) | Quien la usó |
| En cada PR | Marcar "¿Se usó IA?" y enlazar la entrada (N°) en la descripción | Autor del PR |
| Cada semana (15 min en la *review*) | Auditar entradas: ¿completas? ¿validaciones reales? ¿faltan usos evidentes? | Rol 6 |
| Cierre de cada fase | Resumen de usos y lecciones aprendidas | Rol 1 |
| Antes de la sustentación | Revisión final del registro y de las estadísticas (§6) | Todos |

## 5. Áreas de uso esperadas (alineadas con el enunciado)

El enunciado menciona desarrollo asistido (Copilot), generación de pruebas con IA, seguridad al usar IA y revisión de escenarios con IA. Se espera evidencia de cada una:

| Área | Ejemplos de uso legítimo | Entradas mínimas esperadas |
|:---|:---|:---:|
| **Especificación** | Revisar la completitud de escenarios BDD; proponer casos de borde; detectar contradicciones entre documentos | ≥ 3 |
| **Diseño/arquitectura** | Contrastar alternativas (ADRs); detectar riesgos | ≥ 2 |
| **Desarrollo asistido** | Autocompletado de código, *boilerplate*, refactorización | ≥ 5 |
| **Pruebas** | Generar esqueletos de pruebas unitarias/API, datos de prueba, scripts k6 — con la [lista de verificación](../03-calidad-y-operacion/estrategia-pruebas.md#102-lista-de-verificación-de-una-prueba-generada-por-ia) | ≥ 5 |
| **Seguridad** | Revisar código contra OWASP, interpretar hallazgos de SAST/DAST (sin exponer secretos) | ≥ 2 |
| **DevOps** | Dockerfiles, *workflows*, configuración de Nginx/Prometheus | ≥ 2 |
| **Documentación** | Borradores de manuales e informes, revisados por humanos | ≥ 2 |

Estas cifras son una guía de **cobertura**, no una cuota: lo importante es que cada entrada tenga validación real.

---

## 6. Resumen estadístico (actualizar al cerrar cada fase)

| Fase | Entradas | `Sí` | `Parcialmente` | `No` | Con prueba/validación automatizada | Lecciones principales |
|:---|:---:|:---:|:---:|:---:|:---:|:---|
| I | 1 | 0 | 1 | 0 | 0 | *(completar)* |
| II | | | | | | |
| III | | | | | | |
| IV | | | | | | |

---

## 7. Bitácora de entradas reales

> Entradas **reales** del equipo. (Los ejemplos de formato están en §8 y **no** cuentan como registros.)

| N° | Herramienta | Prompt utilizado | Resultado generado | ¿Se utilizó? | Validación realizada | Modificaciones realizadas | Responsable | Fecha |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| **01** | Claude Code (Claude Sonnet 5.5) | *"Necesito que analices toda la documentación respecto a lo que se pide en [el PDF del proyecto del curso]"* y, tras el diagnóstico: *"Sí, tiene que ser una muy buena documentación, tiene que estar todo muy bien documentado"* (+ aclaración: *"solo quiero la documentación"*) | (a) Informe de brechas y contradicciones entre el enunciado y la documentación inicial; (b) reescritura y ampliación de la documentación: documento del proyecto, SRS 2.0, arquitectura, modelo de datos, API REST, ADRs, seguridad/OWASP, DevOps, observabilidad, estrategia de pruebas, UX/UI, roadmap, equipo, gobernanza, registro de IA, entregables; migraciones SQL `V1`/`V2` | **Parcialmente** — pendiente de adopción tras revisión del equipo | Cotejo del enunciado con cada documento; verificación mecánica de enlaces internos y anclas. **Pendiente (no realizado):** revisión humana documento por documento; ejecución de `V1`/`V2` contra MySQL 8.0 real (**el SQL no se ha probado**, Docker no estaba disponible); confirmación de supuestos (equipo de 6, calendario semanas 7–16, dominio de correo, nube) | *(completar tras la revisión: número y descripción de cambios)* | Integrante que ejecutó la sesión (usuario Git `andremelzc`) — *confirmar rol* | 2026-10-03 |
| **02** | Claude Code (Claude Opus 5.5 orquestando, subagente Sonnet 5.5) | *"Implementar el issue #11 (BASE-04): proyecto Vite + React, rutas y estructura; seguir estrictamente los .md del repo (React 18 + JS, estructura de arquitectura §4.2, mapa de rutas de UX, Vitest + RTL + MSW, ESLint/Prettier, VITE_API_URL y proxy). TDD estricto."* | Migración del scaffold (TypeScript/zustand/axios/oxlint) a React 18 + JSX + ESLint/Prettier; estructura por *features*; router con una página *placeholder* por ruta del mapa de UX y página 404; `VITE_API_URL` + proxy de desarrollo; Vitest + jsdom + Testing Library + MSW con pruebas de humo; README del frontend | **Sí** | En `frontend/`: `npm install` (sin vulnerabilidades ni EBADENGINE), `npm run lint` (sin errores), `npm test` (4 archivos, 20 pruebas en verde; las pruebas de rutas/App/config se vieron **fallar** antes de implementar), `npm run test:coverage` (100 % líneas, supera el umbral de 50 %), `npm run build` (OK) y `vite` en dev con respuesta del proxy `/api` (502 sin backend, como se espera). Verificación con `npm view` de que cada dependencia existe y es compatible con React 18 y Node 20 (se bajó `jsdom` a 29 por `engines`; ESLint 9 por el *peer* de `eslint-plugin-react`). | 0 cambios manuales tras la generación; ajustes durante la sesión: `jsdom` 30 → 29, `eslint` 10 → 9, umbrales de cobertura a 50 % (el doc exige falla bajo 50 %), excepción en `.gitignore` para `.env.example` | R5 · Andre Cuenca | 2026-10-08 |
| *03* | | | | | | | | |

---

## 8. Ejemplos de formato (ilustrativos — **no son registros reales**)

Se conservan como guía de cuánto detalle se espera. **No** deben contarse en las estadísticas ni presentarse como evidencia del equipo; están fechados a propósito como `AAAA-MM-DD`.

| N° | Herramienta | Prompt utilizado | Resultado generado | ¿Se utilizó? | Validación realizada | Modificaciones realizadas | Responsable | Fecha |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| *Ej-A* | GitHub Copilot | *"Escribir prueba unitaria JUnit 5 y Mockito para `SolicitudWorkflowService.resolver` verificando que solo se permita pasar a `RESUELTA` si la solicitud estaba en `EN_ATENCION`."* | Clase de prueba con mocks de repositorio y aserción de `TransicionInvalidaException`. | Sí (parcialmente) | Ejecución `mvn test -Dtest=SolicitudWorkflowServiceTest`; se rompió a propósito la regla en el servicio y la prueba **falló** (verifica que detecta el defecto). | 3: se alinearon nombres con el enum `EstadoSolicitud`; se añadió aserción sobre el guardado del historial; se eliminó un *mock* innecesario. | Rol 2 | AAAA-MM-DD |
| *Ej-B* | ChatGPT (modelo indicado) | *"Genera un hook `useFetch` con estados loading/error y cancelación con `AbortController`."* | Hook en JavaScript con `useEffect` y cancelación. | Sí (parcialmente) | Pruebas con Testing Library de carga, error y desmontaje (sin fugas); revisión línea a línea. | 2: se integró con el `apiClient` centralizado (interceptor JWT); se añadió manejo de 401/403. | Rol 4 | AAAA-MM-DD |

---

## 9. Plantilla para copiar

```markdown
| NN | <herramienta y modelo> | <prompt real, sin secretos> | <qué generó> | <Sí/No/Parcialmente (qué parte)> | <qué prueba o comprobación concreta se hizo> | <cuántas y cuáles modificaciones> | <Rol N — nombre> | AAAA-MM-DD |
```

## 10. Reflexión final (se completa en la Fase IV)

Para la sustentación, el equipo prepara una reflexión breve (≤ 1 página) que responde:

1. ¿Dónde la IA **aceleró** el trabajo y dónde **hizo perder tiempo**?
2. ¿Qué **errores** de la IA se detectaron gracias a las pruebas o a la revisión? (ejemplos concretos del registro)
3. ¿Qué aprendimos que **no habríamos aprendido** si la IA hubiera hecho todo?
4. ¿Qué haríamos distinto con el uso de IA en un proyecto real?
