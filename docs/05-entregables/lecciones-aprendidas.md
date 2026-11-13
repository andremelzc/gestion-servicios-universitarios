# Lecciones aprendidas (proyecto y uso de IA)

Respuesta a la reflexión final de [Registro de IA §10](../04-gestion/ia-register.md). Mensaje común: la IA automatiza y acelera, pero la intervención humana es necesaria para detectar bugs y sostener la dirección del proyecto. Cada rol lo cuenta desde su trabajo.

## R1 — Tech Lead / SM (dirección del proyecto)
La IA nos dio velocidad para producir documentación, borradores de código y checklists, pero no decidía hacia dónde iba el proyecto. Priorizar el MVP, recortar alcance y aceptar riesgos fue siempre una decisión humana. Sin esa dirección, la IA habría producido mucho de lo que no importaba.

## R2 — Backend 1 (reglas de negocio)
La IA escribía servicios y validaciones rápido, pero a veces con reglas equivocadas o incompletas. Las pruebas de integración y la revisión línea a línea detectaron esos errores. Aprendí a tratar su código como el de un tercero: útil, pero hay que verificarlo.

## R3 — Backend 2 / DBA (datos)
Generar migraciones y consultas fue más rápido, pero la IA no siempre pensaba en integridad, índices ni en el costo de las consultas. Revisar el esquema y los planes a mano evitó problemas que solo aparecen con datos reales.

## R4 — Frontend 1 (experiencia de usuario)
La IA armaba pantallas y componentes en minutos, pero fue la revisión humana en el navegador la que encontró lo que el código no mostraba: paginación rota, desbordes en móvil y flujos sin conectar. Ver la aplicación funcionando no se puede delegar.

## R5 — Frontend 2 (accesibilidad y calidad)
La IA ayudó a aplicar patrones de accesibilidad, pero no sustituye probar con teclado y criterio propio. Muchos fallos eran sutiles (foco, contraste, mensajes) y los detectó una persona al usar la interfaz como lo haría un usuario real.

## R6 — QA / DevOps / Seguridad (confiabilidad)
La IA automatizó pipelines y pruebas, pero marcar algo como "hecho" sin comprobarlo es el riesgo. Un smoke test simulado parecía correcto y solo la verificación contra el entorno real mostró que un endpoint seguía expuesto. Automatizar sí, confiar sin verificar no.

## Qué haríamos distinto
Definir desde el inicio qué se verifica siempre a mano (seguridad, despliegue, interfaz real), registrar los errores de la IA cuando ocurren y no cerrar tareas sin evidencia.
