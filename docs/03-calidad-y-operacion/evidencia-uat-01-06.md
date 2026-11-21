# Evidencia de UAT-01 a UAT-06

QA-19 · [Issue #180](https://github.com/andremelzc/gestion-servicios-universitarios/issues/180) · 20/11/2026 (hora de Lima).

El [frontend documentado de staging](https://frontend-servicios-2o4nr29q3.vercel.app/) respondió HTTP 200 en la portada y HTTP 404 en `/api/v1/categorias`. El backend de staging documentado no respondió a la comprobación de salud dentro de 25 segundos. Los seis casos quedaron **bloqueados en staging**.

La verificación se ejecutó en un despliegue local aislado de `develop` (`840c8a7`), con React servido por Vite, backend Spring Boot, MySQL independiente y datos ficticios. Se usó Chromium de Playwright a 1280 × 820, sin interceptar ni simular respuestas. Se repitió el recorrido completo y la última ejecución usó la solicitud `SOL-2026-0028`. Los resultados locales corresponden a los [criterios UAT de la estrategia de pruebas](estrategia-pruebas.md#72-pruebas-de-aceptación-de-usuario-uat).

| Caso | Comprobación | Resultado local | Capturas |
|:--|:--|:--|:--|
| UAT-01 | Registro, login, Mis solicitudes y acceso denegado al dashboard para un estudiante. | **Aprobado.** El registro redirigió a Mis solicitudes, el login devolvió HTTP 200 y el dashboard mostró «Acceso no permitido». | [Mis solicitudes](evidencias/uat-01-06/01-mis-solicitudes.png) · [Acceso denegado](evidencias/uat-01-06/01-dashboard-denegado.png) |
| UAT-02 | Registrar una solicitud con una imagen PNG de 2 MiB. | **Aprobado.** HTTP 201, código `SOL-2026-0028`, estado Registrada y evidencia visible en el detalle. | [Confirmación](evidencias/uat-01-06/02-solicitud-registrada.png) · [Detalle](evidencias/uat-01-06/02-detalle.png) |
| UAT-03 | Rechazar un archivo inerte `.exe` y una imagen de 10 MiB en cliente y servidor con mensajes claros. | **Fallido.** La UI rechazó ambos con mensajes específicos. La API devolvió HTTP 415 con mensaje claro para el `.exe` y HTTP 500 genérico para la imagen de 10 MiB. | [Rechazo en la interfaz](evidencias/uat-01-06/03-archivos-rechazados.png) |
| UAT-04 | Evaluar, cambiar prioridad a ALTA y asignar un técnico del área. | **Aprobado.** La solicitud pasó a Asignada y el detalle confirmó el técnico de TI y la prioridad ALTA. | [Asignación](evidencias/uat-01-06/04-asignacion.png) · [Detalle asignado](evidencias/uat-01-06/04-detalle-asignada.png) |
| UAT-05 | Iniciar atención y resolver con informe y foto. | **Aprobado.** Pasó de Por iniciar a En curso. El técnico adjuntó la evidencia y el detalle mostró Resuelta. | [Informe y evidencia](evidencias/uat-01-06/05-resolucion.png) · [Detalle resuelto](evidencias/uat-01-06/05-detalle-resuelta.png) |
| UAT-06 | Cerrar con conformidad y comprobar el dashboard. | **Aprobado.** El estudiante confirmó el cierre. El detalle mostró Cerrada y el conteo global de ese estado pasó de 5 a 6 en el endpoint del dashboard. | [Detalle cerrado](evidencias/uat-01-06/06-detalle-cerrada.png) · [Dashboard](evidencias/uat-01-06/06-dashboard.png) |

La prueba de adjuntos de la API usó el backend local directo para observar su respuesta HTTP. El log del HTTP 500 registró `MaxUploadSizeExceededException` (`traceId` `6aeb1c69e90c4ef4a0b7b6911b5fed18`). Queda pendiente corregir la respuesta por exceso de tamaño y volver a ejecutar los seis casos en staging con su API operativa.
