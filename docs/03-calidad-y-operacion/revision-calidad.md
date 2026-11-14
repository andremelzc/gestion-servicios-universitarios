# Revisión general de calidad (QA-22)

> Fecha: 13/11/2026 · Alcance: backend y frontend en `develop` (92e96c2). Método: búsqueda estática en el código y revisión de la auditoría de interfaz (`auditoria-ui.md`, rama `fix/auditoria-ui`), más comprobaciones directas sobre el backend desplegado. **Los N+1 no se midieron con logs de Hibernate**; solo se revisó que las consultas de listados usen `JOIN FETCH`/`@EntityGraph` (32 usos en `backend/src/main`).

## 1. Resultado por criterio

| Criterio | Resultado | Evidencia |
|:---|:---|:---|
| Depuración olvidada | Limpio | 0 `System.out`/`printStackTrace` en `backend/src/main`; 0 `console.log`/`debugger` en `frontend/src` (fuera de pruebas) |
| Secretos y *hardcode* | Limpio | Sin contraseñas ni secretos literales en `backend/src/main`; configuración por variables de entorno (`.env.example`); `gitleaks` pasa en `security.yml` |
| Manejo de errores | Correcto con una excepción | Errores RFC 7807 con `traceId` (visto en respuestas reales). Pendiente: 401/403 aún sin manejador propio (`SecurityConfig`, TODO) y rutas inexistentes responden 500 en lugar de 404/405 |
| Exposición de endpoints | **Corregido** | `/actuator/prometheus` era público en producción (200 sin token). Ahora solo se permite en un puerto de gestión separado; con un único puerto exige autenticación (`SecurityConfig`). Las pruebas `ActuatorEndpointIntegrationTest` y `AdminAutorizacionIT` pasan |
| Consultas | Sin hallazgos estáticos | Uso de `JOIN FETCH`/`@EntityGraph`; paginación en listados |
| Código pendiente | 8 `TODO` conocidos | Recuperar/restablecer contraseña (HU-02), bloqueo por intentos (US-20) en 4 puntos, manejadores 401/403, y un `TODO` en `EstadoFormModal.jsx`. Son funciones diferidas, no defectos ocultos |
| Pruebas | Cumple | Cobertura backend 81,2 % y frontend 68,4 % ([Informe de pruebas](../INFORME_PRUEBAS.md)); sin `@Disabled` en pruebas |
| Interfaz | 25 hallazgos documentados | `auditoria-ui.md`: 6 ALTA, resto media/baja. Se priorizan los que bloquean tareas (menú por rol, enlace al detalle, cierre de solicitud, paginación "NaN", desborde en móvil) |

## 2. Refactor aplicado en esta revisión
- Cierre de la exposición pública de `/actuator/prometheus` en producción.

## 3. Pendiente y riesgo aceptado
- Hallazgos de interfaz AUD-01 a AUD-25: seguimiento en `auditoria-ui.md`; se tratan en la rama `fix/auditoria-ui`.
- En Render, `/actuator/health` responde 500 (producción y staging) porque Actuator escucha en el puerto 8081, que no se publica. La API funciona. Solución: definir `MANAGEMENT_PORT` igual al puerto de la aplicación en ambos servicios.
- Funciones diferidas (recuperación de contraseña, bloqueo por intentos): fuera del alcance del MVP.
