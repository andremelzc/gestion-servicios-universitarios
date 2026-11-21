# Guion de la demostración integral

DOC-12 ([issue #192](https://github.com/andremelzc/gestion-servicios-universitarios/issues/192)) · **25 minutos de exposición + 5 o más de preguntas**. La [presentación de apoyo](presentacion-demostracion.pptx) sigue el mismo orden. La demostración, el ensayo cronometrado y la duración aprobada por el docente quedan por confirmar.

## Preparación

- **R1** abre el cronómetro, la presentación y el [release `v1.0.0`](https://github.com/andremelzc/gestion-servicios-universitarios/releases/tag/v1.0.0). Confirma con R6 qué versión está desplegada antes de anunciarla.
- **R4 y R5** dejan listas cuatro sesiones separadas con cuentas ficticias autorizadas y los archivos de evidencia JPG o PNG. R4 abre el formulario del estudiante y R5 deja listas las bandejas de supervisor y técnico y la administración.
- **R2 y R3** preparan Bruno con una cuenta de demo y una consulta de solo lectura en MySQL. No proyectan contraseñas, JWT ni cadenas de conexión. **R6** deja abiertos GitHub Actions, los informes y el tablero de observabilidad. Revisa TLS y salud antes de compartir pantalla.
- En el ensayo usa el [ambiente local aislado](informes-y-sustentacion.md#54-recreación-local-aislada-issue-191). En la presentación usa el ambiente de demostración autorizado. Si un servicio falla, identifica el entorno y la fecha de la evidencia que muestres y registra el paso como pendiente de repetir. Si falta Swagger en el ambiente autorizado, ejecuta la consulta en Bruno y abre el contrato OpenAPI publicado en el repo.

## Secuencia y tiempos

| # | Reloj | Bloque | Expone | Acción y evidencia |
|---|---|---|---|---|
| 1 | 00:00–01:00 | Problema | R1 | Describe pérdida y duplicación, falta de seguimiento, trazabilidad, responsable, tiempos, medición de calidad e indicadores. Presenta la conformidad de cierre como el mecanismo del alcance actual. [Problemas P1–P7](../01-definicion/documento-proyecto.md#22-problemas-concretos-los-que-el-sistema-debe-resolver). |
| 2 | 01:00–02:00 | Solución propuesta | R1 | Presenta los cinco módulos: autenticación, registro, gestión, dashboard y administración. Explica qué hace cada rol de la aplicación: estudiante/solicitante, técnico, supervisor y administrador. [Actores y alcance](../01-definicion/documento-proyecto.md#4-actores-y-usuarios). |
| 3 | 02:00–03:00 | Arquitectura | R1 | Muestra el recorrido React → API REST Spring Boot → MySQL. Sitúa Docker, CI/CD, nube y observabilidad. Entrega el control a R4. [Arquitectura](../02-diseno/arquitectura-tecnica.md). |
| 4 | 03:00–04:00 | Historias de usuario | R4 | Conecta las épicas de registro y gestión con dos escenarios: alta con evidencia → código y estado registrado, y asignación válida → técnico e historial. Muestra los criterios y los pasos 2 y 5 de la prueba. [Especificación](../01-definicion/especificaciones-tecnicas.md) · [Evidencia E2E](../03-calidad-y-operacion/evidencia-e2e-mvp.md#2-guion-ejecutado-con-los-4-roles). |
| 5 | 04:00–10:00 | Demo Frontend | R4, R5 y R3 | Sigue la escaleta de seis minutos de abajo y conserva el código de la solicitud para API, BD y observabilidad. |
| 6 | 10:00–12:00 | Demo Backend/API | R2 | Sobre la solicitud del paso 5, muestra el JWT configurado sin exponer su valor y ejecuta GET de detalle desde Swagger o Bruno. Compara el 200 del titular con una respuesta de error RFC 7807 ya verificada, con `traceId`. [API REST](../02-diseno/api-rest.md) · [Colección Bruno](../../api-tests/). |
| 7 | 12:00–13:00 | Base de datos | R3 | Abre el esquema. Filtra `solicitudes` e `historial_solicitudes` por el código de la demo y muestra la fila y sus transiciones ordenadas. Explica cómo se impiden cambios y borrados en el historial. [Modelo](../02-diseno/modelo-datos.md) · [Evidencia MySQL](../03-calidad-y-operacion/evidencia-e2e-mvp.md#3-evidencia-de-trazabilidad-en-base-de-datos-historial_solicitudes). |
| 8 | 13:00–16:00 | Seguridad | R6 y R1 | R6 demuestra en el entorno de prueba autorizado una consulta ajena denegada, texto con HTML rechazado y un archivo inocuo de extensión no admitida. R1 muestra reportes de CodeQL, gitleaks y ZAP y menciona los hallazgos que sigan abiertos. [Evidencias y hardening](../03-calidad-y-operacion/evidencias/fase-3/README.md). |
| 9 | 16:00–18:00 | Testing | R6 | Muestra el informe y los artefactos de cobertura. Compara el P95 de k6 con el umbral RNF-02 indicando escenario y entorno. Expón el SUS con sus respaldos si el equipo confirma la evidencia del [issue #182](https://github.com/andremelzc/gestion-servicios-universitarios/issues/182). [Informe de pruebas](../INFORME_PRUEBAS.md) · [Resultados k6](../../tests/performance/resultados/). |
| 10 | 18:00–20:00 | CI/CD | R6 | Abre un PR con CI verde y la ejecución de despliegue correspondiente. Muestra el tag y el release y explica el disparador de staging y producción. [Pipeline y despliegue](../03-calidad-y-operacion/devops-despliegue.md#4-pipeline-cicd-github-actions). |
| 11 | 20:00–21:00 | Cloud | R6 | Abre la URL pública aprobada, comprueba TLS desde el navegador y distingue dev, staging y producción. Si falla health, cita el estado observado. [Ambientes y URLs](../MANUAL_TECNICO.md) · [Evidencia operativa](../03-calidad-y-operacion/evidencias/fase-3/README.md). |
| 12 | 21:00–23:00 | Observabilidad | R6 | En el entorno autorizado, provoca un error controlado y copia el `traceId`. Localízalo en logs y traza y muestra el tablero de Grafana. Para la alerta, usa la evidencia del simulacro si no hay un ensayo aislado preparado. [Observabilidad](../03-calidad-y-operacion/observabilidad.md) · [Simulacro](../incidentes/INC-20261106-01-simulacro-caida-bd-y-backend.md). |
| 13 | 23:00–24:00 | Resultados | R1 | Recorre OE-1/2 (especificación y UX), OE-3/4 (MVP y API), OE-5/6 (seguridad y entrega), OE-7/8 (pruebas y observabilidad), OE-9/10 (IA y entregables). Distingue lo respaldado y lo pendiente según la evidencia. [Objetivos](../01-definicion/documento-proyecto.md#32-objetivos-específicos-y-cómo-se-verifican) · [Checklist de release](checklist-release.md). |
| 14 | 24:00–25:00 | Lecciones aprendidas | R1 y R2 | R1 resume sprints y alcance. R2 y R1 presentan dos casos de verificación de trabajo asistido por IA: los errores de carga/envío que se borraban por concurrencia y la pérdida de foco del diálogo durante el guardado. Explican cómo las pruebas cubren cada regresión y qué validar antes en el próximo sprint. [Lecciones](lecciones-aprendidas.md) · [Registro R4, entradas R4-19 y R4-20](../04-gestion/ia-registro/r4-frontend-1.md). |
| — | 25:00–30:00+ | Preguntas | Todo el equipo | Abre las [preguntas de sustentación](informes-y-sustentacion.md#6-preguntas-que-el-equipo-debe-saber-responder). Cada integrante responde también por decisiones fuera de su módulo. |

### Escaleta de la demo Frontend

| Reloj | Expone | Acción | Confirmación en pantalla |
|---|---|---|---|
| 04:00–05:30 | R4 | Registra un estudiante ficticio si el ambiente lo permite o entra con una cuenta demo. Crea una solicitud de TI con una foto de prueba. | Código, estado `REGISTRADA` y evidencia en el detalle. R4 comparte el código con R5. |
| 05:30–06:45 | R5 | Desde la sesión del supervisor de TI, busca el código, evalúa si el flujo lo requiere y asigna al técnico de TI. | Técnico asignado y transición en el historial. |
| 06:45–08:00 | R5 | Desde la sesión del técnico, inicia atención y resuelve con informe y evidencia de reparación. | Estados `EN_ATENCION` y `RESUELTA`, informe y evidencia. |
| 08:00–08:45 | R4 | Vuelve al detalle como estudiante titular y confirma el cierre. | Estado `CERRADA` e historial. Si el despliegue no expone el control, R2 puede mostrar el cierre por API en su turno y R4 vuelve al detalle para ver el estado. |
| 08:45–10:00 | R3 y R5 | R3 compara el dashboard del supervisor y del administrador. R5 crea y desactiva una categoría de demo en el ambiente autorizado. | Vista de área frente a vista global, y categoría inactiva. |

Respaldo del paso 5: [recorrido integrado por API y MySQL](../03-calidad-y-operacion/evidencia-e2e-mvp.md) y [capturas de dashboard y administración](../03-calidad-y-operacion/evidencia-uat-09-10.md). Mantén cada punto en su orden y usa el código que se haya mostrado en el recorrido.
