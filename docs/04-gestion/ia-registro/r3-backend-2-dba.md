# Registro de uso de IA — R3 · Backend 2 / DBA

> Bitácora **personal** de este rol. Las reglas, los campos, los criterios de aceptación y la auditoría están en el [Registro de IA](../ia-register.md); aquí solo se añaden filas. **Solo edita este archivo quien tiene este rol**, para que dos PR no choquen en el mismo `.md`.

**N°:** `R3-NN`, correlativo propio (01, 02, …). Prompt **sin secretos ni datos personales**; una entrada sin validación concreta no es válida.

| N° | Herramienta | Prompt utilizado | Resultado generado | ¿Se utilizó? | Validación realizada | Modificaciones realizadas | Responsable | Fecha |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| **R3-01** (antes N° 09) | Zed AI (GPT-6-Luna) | Implementar BASE-05 con seeder demo para usuarios seguros, solicitudes en distintos estados y cantidad configurable; diagnosticar y corregir fallos observados al probar Docker. | `DemoDataSeeder`, configuración `application-demo.yml`, variables Compose y correcciones al arranque Docker, logging demo y tipo de `estados_solicitud.orden`. | Sí | `docker compose build backend` terminó; backend arrancó en Docker; consultas SQL confirmaron 8 usuarios de cuatro roles, 200 solicitudes en seis estados y catálogos V2 (3 áreas, 6 categorías, 4 prioridades, 6 estados). `./mvnw -q test` agotó el timeout mientras Testcontainers iniciaba MySQL. | 3: ejecución del JAR con `java -jar`; logging legible para `demo`; `EstadoSolicitud.orden` de `Short` a `Byte` por el `TINYINT` de V1. | R3 Backend 2 / DBA — NickSalA | 2026-10-09 |
