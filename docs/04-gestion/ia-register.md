# Registro de Uso de Inteligencia Artificial (IA)

> **Norma del proyecto (requisito transversal del enunciado):** cada grupo mantiene este registro. Sirve para demostrar que la IA se usó como **herramienta de ingeniería** (generar pruebas, revisar escenarios, proponer plantillas de código) y **no como sustituto del aprendizaje** ni del razonamiento técnico.
> Relacionados: [Estrategia de pruebas §10](../03-calidad-y-operacion/estrategia-pruebas.md#10-pruebas-con-apoyo-de-ia) · [Seguridad §11](../03-calidad-y-operacion/seguridad-owasp.md#11-seguridad-en-el-uso-de-ia) · [Gobernanza Git (PR)](equipo-y-flujo-de-trabajo.md#31-ciclo-de-vida)

---

## 1. ¿Qué se registra?

Se registra **todo uso significativo** de IA. Es _significativo_ si el resultado se incorporó (total o parcialmente) o influyó en una decisión de **código, pruebas, arquitectura, especificación, documentación, seguridad o despliegue**.

| Se registra                                                                       | No hace falta registrar                                     |
| :-------------------------------------------------------------------------------- | :---------------------------------------------------------- |
| Código, consultas SQL, configuraciones,_workflows_ generados o modificados con IA | Corrector ortográfico o autocompletado trivial de una línea |
| Pruebas generadas o escenarios BDD propuestos/revisados por IA                    | Preguntas puntuales de sintaxis cuyo resultado no se usa    |
| Borradores de documentación, ADRs, planes o informes                              | Búsquedas de documentación sin generar contenido            |
| Revisión de seguridad o de arquitectura asistida por IA                           |                                                             |
| Diseño (textos de interfaz, ideas de UX) generado con IA                          |                                                             |

**Regla de oro:** en la duda, se registra.

## 2. Campos del registro

Son los campos exigidos por el enunciado, más número y fecha para trazabilidad.

| Campo                    | Qué escribir                                                                                                                             |
| :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| **N°**                   | Correlativo (01, 02, …)                                                                                                                  |
| **Herramienta**          | Nombre y versión/modelo (Copilot, ChatGPT-4o, Claude…)                                                                                   |
| **Prompt**               | El prompt**real** (resumido si es muy largo). **Sin secretos ni datos personales**                                                       |
| **Resultado generado**   | Qué produjo: código, prueba, arquitectura, BDD, texto…                                                                                   |
| **¿Se utilizó?**         | `Sí` · `No` · `Parcialmente` (indicar qué parte)                                                                                         |
| **Validación realizada** | Cómo se comprobó: ejecución de pruebas, revisión línea a línea, prueba manual, comparación con la documentación oficial, pasada de SAST… |
| **Modificaciones**       | Qué se cambió respecto a lo generado (número y descripción)                                                                              |
| **Responsable**          | Rol e integrante que lo usó y responde por el resultado                                                                                  |
| **Fecha**                | `AAAA-MM-DD`                                                                                                                             |

> _Una entrada sin validación concreta no es válida: "se revisó" no basta; debe indicar **qué** prueba o comprobación se hizo._

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

| Cuándo                             | Qué                                                                         | Quién        |
| :--------------------------------- | :-------------------------------------------------------------------------- | :----------- |
| Al usar IA                         | Registrar**inmediatamente** (no al final)                                   | Quien la usó |
| En cada PR                         | Marcar "¿Se usó IA?" y enlazar la entrada (N°) en la descripción            | Autor del PR |
| Cada semana (15 min en la*review*) | Auditar entradas: ¿completas? ¿validaciones reales? ¿faltan usos evidentes? | Rol 6        |
| Cierre de cada fase                | Resumen de usos y lecciones aprendidas                                      | Rol 1        |
| Antes de la sustentación           | Revisión final del registro y de las estadísticas (§6)                      | Todos        |

## 5. Áreas de uso esperadas (alineadas con el enunciado)

El enunciado menciona desarrollo asistido (Copilot), generación de pruebas con IA, seguridad al usar IA y revisión de escenarios con IA. Se espera evidencia de cada una:

| Área                    | Ejemplos de uso legítimo                                                                                                                                                                                          | Entradas mínimas esperadas |
| :---------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------: |
| **Especificación**      | Revisar la completitud de escenarios BDD; proponer casos de borde; detectar contradicciones entre documentos                                                                                                      |            ≥ 3             |
| **Diseño/arquitectura** | Contrastar alternativas (ADRs); detectar riesgos                                                                                                                                                                  |            ≥ 2             |
| **Desarrollo asistido** | Autocompletado de código,_boilerplate_, refactorización                                                                                                                                                           |            ≥ 5             |
| **Pruebas**             | Generar esqueletos de pruebas unitarias/API, datos de prueba, scripts k6 — con la[lista de verificación](../03-calidad-y-operacion/estrategia-pruebas.md#102-lista-de-verificación-de-una-prueba-generada-por-ia) |            ≥ 5             |
| **Seguridad**           | Revisar código contra OWASP, interpretar hallazgos de SAST/DAST (sin exponer secretos)                                                                                                                            |            ≥ 2             |
| **DevOps**              | Dockerfiles,_workflows_, configuración de Nginx/Prometheus                                                                                                                                                        |            ≥ 2             |
| **Documentación**       | Borradores de manuales e informes, revisados por humanos                                                                                                                                                          |            ≥ 2             |

Estas cifras son una guía de **cobertura**, no una cuota: lo importante es que cada entrada tenga validación real.

---

## 6. Resumen estadístico (actualizar al cerrar cada fase)

| Fase | Entradas | `Sí` | `Parcialmente` | `No` | Con prueba/validación automatizada | Lecciones principales |
| :--- | :------: | :--: | :------------: | :--: | :--------------------------------: | :-------------------- |
| I    |    1     |  0   |       1        |  0   |                 0                  | _(completar)_         |
| II   |          |      |                |      |                                    |                       |
| III  |          |      |                |      |                                    |                       |
| IV   |          |      |                |      |                                    |                       |

---

## 7. Bitácora de entradas reales

> Entradas **reales** del equipo. (Los ejemplos de formato están en §8 y **no** cuentan como registros.)

| N°     | Herramienta                        | Prompt utilizado                                                                                                                                                                                                                                                                   | Resultado generado                                                                                                                                                                                                                                                                                                                                                                  | ¿Se utilizó?                                                      | Validación realizada                                                                                                                                                                                                                                                                                                                                                  | Modificaciones realizadas                                                                                                                                                    | Responsable                                                                  | Fecha      |
| :----- | :--------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- | :--------- |
| **01** | Claude Code (Claude Sonnet 5.5)    | _"Necesito que analices toda la documentación respecto a lo que se pide en [el PDF del proyecto del curso]"_ y, tras el diagnóstico: _"Sí, tiene que ser una muy buena documentación, tiene que estar todo muy bien documentado"_ (+ aclaración: _"solo quiero la documentación"_) | (a) Informe de brechas y contradicciones entre el enunciado y la documentación inicial; (b) reescritura y ampliación de la documentación: documento del proyecto, SRS 2.0, arquitectura, modelo de datos, API REST, ADRs, seguridad/OWASP, DevOps, observabilidad, estrategia de pruebas, UX/UI, roadmap, equipo, gobernanza, registro de IA, entregables; migraciones SQL`V1`/`V2` | **Parcialmente** — pendiente de adopción tras revisión del equipo | Cotejo del enunciado con cada documento; verificación mecánica de enlaces internos y anclas.**Pendiente (no realizado):** revisión humana documento por documento; ejecución de `V1`/`V2` contra MySQL 8.0 real (**el SQL no se ha probado**, Docker no estaba disponible); confirmación de supuestos (equipo de 6, calendario semanas 7–16, dominio de correo, nube) | _(completar tras la revisión: número y descripción de cambios)_                                                                                                              | Integrante que ejecutó la sesión (usuario Git`andremelzc`) — _confirmar rol_ | 2026-10-03 |
| **02** | Antigravity IDE (Gemini 3.8 Flash) | _"Necesito que generes una propuesta de clase SlaCalculator aplicando la regla RN-09 y una prueba unitaria JUnit 5 con reloj fijo"_                                                                                                                                                | Clase base SlaCalculator y esqueleto de prueba unitaria con Clock.fixed                                                                                                                                                                                                                                                                                                             | Sí (parcialmente)                                                 | Revisión línea a línea de la regla RN-09 contra la especificación (que era mínimo de horas entre categoría y prioridad) y la verificación de aserciones en casos borde                                                                                                                                                                                                | 3: se adaptó para inyectar el Clock del bean ClockConfig; se agregaron validaciones de parámetros nulos (IllegalArgumentException)y se ajustaron los nombres según el modelo | Rol 2 — Roberto Pizarro                                                      | 2026-10-08 |
| _03_   |                                    |                                                                                                                                                                                                                                                                                    |                                                                                                                                                                                                                                                                                                                                                                                     |                                                                   |                                                                                                                                                                                                                                                                                                                                                                       |                                                                                                                                                                              |                                                                              |            |

---

## 8. Ejemplos de formato (ilustrativos — **no son registros reales**)

Se conservan como guía de cuánto detalle se espera. **No** deben contarse en las estadísticas ni presentarse como evidencia del equipo; están fechados a propósito como `AAAA-MM-DD`.

| N°     | Herramienta               | Prompt utilizado                                                                                                                                                                    | Resultado generado                                                                   | ¿Se utilizó?      | Validación realizada                                                                                                                                            | Modificaciones realizadas                                                                                                                   | Responsable | Fecha      |
| :----- | :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- | :---------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ | :---------- | :--------- |
| _Ej-A_ | GitHub Copilot            | _"Escribir prueba unitaria JUnit 5 y Mockito para `SolicitudWorkflowService.resolver` verificando que solo se permita pasar a `RESUELTA` si la solicitud estaba en `EN_ATENCION`."_ | Clase de prueba con mocks de repositorio y aserción de`TransicionInvalidaException`. | Sí (parcialmente) | Ejecución`mvn test -Dtest=SolicitudWorkflowServiceTest`; se rompió a propósito la regla en el servicio y la prueba **falló** (verifica que detecta el defecto). | 3: se alinearon nombres con el enum`EstadoSolicitud`; se añadió aserción sobre el guardado del historial; se eliminó un _mock_ innecesario. | Rol 2       | AAAA-MM-DD |
| _Ej-B_ | ChatGPT (modelo indicado) | _"Genera un hook `useFetch` con estados loading/error y cancelación con `AbortController`."_                                                                                        | Hook en JavaScript con`useEffect` y cancelación.                                     | Sí (parcialmente) | Pruebas con Testing Library de carga, error y desmontaje (sin fugas); revisión línea a línea.                                                                   | 2: se integró con el`apiClient` centralizado (interceptor JWT); se añadió manejo de 401/403.                                                | Rol 4       | AAAA-MM-DD |

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
