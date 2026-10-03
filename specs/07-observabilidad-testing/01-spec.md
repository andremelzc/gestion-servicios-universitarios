# Spec 07 — Calidad, Observabilidad y Pruebas (Fase IV)

## 1. Ficha

| Campo | Valor |
|:---|:---|
| **Épica** | ET — Técnica: DevOps, seguridad y calidad |
| **Historias técnicas** | TS-05 Observabilidad · TS-06 Pruebas automatizadas · TS-07 Carga y estrés |
| **Requerimientos** | RNF-02, RNF-04, RNF-06, RNF-07, RNF-08, RNF-12, RNF-13 |
| **Responsable** | Rol 6 (lidera) · Rol 3 (alertas y *dataset* de carga) · Roles 2, 4 y 5 (pruebas de su código) |
| **Prioridad** | **Must** |
| **Documentos fuente** | [Observabilidad](../../docs/03-calidad-y-operacion/observabilidad.md) · [Estrategia de pruebas](../../docs/03-calidad-y-operacion/estrategia-pruebas.md) · [ADR-008](../../docs/02-diseno/decisiones-arquitectura.md#adr-008--herramientas-de-prueba-y-seguridad-automatizada) · Plan: [`02-plan.md`](02-plan.md) · Tareas: [`03-tasks.md`](03-tasks.md) |
| **Fuera de alcance** | APM comercial; *chaos engineering* sistemático; pruebas en dispositivos reales (se usan emuladores) |

**Contexto:** para considerar el sistema un producto profesional no basta con probarlo a mano. Debe **soportar carga**, estar **instrumentado** para reportar errores en vivo y contar con **pruebas automatizadas robustas** y un informe de pruebas.

---

## 2. Historias técnicas

### TS-05 — Observabilidad y monitoreo
- **Como** administrador de sistemas, **quiero** que el sistema exporte métricas y mantenga logs estructurados y trazas, **para** diagnosticar cuellos de botella, detectar errores de forma proactiva y gestionar incidentes.

### TS-06 — Pruebas funcionales, de integración y de API
- **Como** desarrollador, **quiero** pruebas automatizadas (unitarias, integración, API) trazadas a los criterios de aceptación, **para** confiar en que la base de código es sólida y no se rompe con cada cambio.

### TS-07 — Pruebas de carga y estrés
- **Como** arquitecto, **quiero** someter el sistema a concurrencia creciente, **para** garantizar que no se cae en periodos de alta demanda (ej. matrículas) y conocer su punto de quiebre.

---

## 3. Criterios de aceptación (BDD)

### Observabilidad

#### CA-1 — Trazabilidad de errores *(TS-05, RNF-06)*
```gherkin
Dado un usuario interactuando con el sistema
Cuando ocurre una excepción no controlada en el backend
Entonces el sistema registra el error con su stacktrace en los logs con un traceId único
  Y retorna al cliente un 500 con mensaje genérico, sin stacktrace, y el mismo traceId (cuerpo y cabecera X-Trace-Id)
  Y el frontend muestra "Ocurrió un error inesperado. Código de soporte: <traceId>"
  Y buscando ese traceId en los logs se encuentra la causa exacta
```

#### CA-2 — `traceId` en toda petición *(TS-05)*
```gherkin
Dado cualquier petición a la API (exitosa o con error)
Entonces la respuesta incluye la cabecera X-Trace-Id
  Y todos los logs de esa petición contienen el mismo traceId
  Y si la petición traía "traceparent" (W3C), se reutiliza ese identificador
```

#### CA-3 — Logs estructurados y seguros *(TS-05, RNF-13)*
```gherkin
Dado el backend en ejecución
Cuando se leen sus logs
Entonces cada línea es JSON con timestamp, level, logger, message, traceId, usuarioId (si aplica), ruta, estado y duracionMs
  Y no aparece ninguna contraseña, token JWT, JWT_SECRET ni cuerpo completo de petición
  Y los correos en eventos de seguridad están enmascarados
```

#### CA-4 — Métricas expuestas *(TS-05)*
```gherkin
Dado el backend en ejecución
Cuando Prometheus consulta /actuator/prometheus desde la red interna
Entonces expone métricas HTTP (con percentiles), JVM, pool de BD y las métricas de negocio solicitudes_creadas_total, solicitudes_transiciones_total, solicitudes_pendientes, solicitudes_vencidas y auth_login_total
  Y ninguna métrica usa etiquetas de alta cardinalidad (id de usuario, código de solicitud)
  Y el endpoint no es accesible desde Internet
```

#### CA-5 — Salud y reinicio *(TS-05, RNF-07)*
```gherkin
Dado que la base de datos se detiene
Cuando se consulta /actuator/health
Entonces el componente db figura DOWN y readiness falla
  Y la alerta "BDInaccesible" se dispara
Cuando la base de datos se recupera
Entonces el servicio vuelve a "UP" sin reiniciar manualmente el backend
```

#### CA-6 — Alertas y simulacro *(TS-05)*
```gherkin
Dado las alertas configuradas (instancia caída, error 5xx > 5 % y BD inaccesible)
Cuando se detiene el contenedor backend durante más de 1 minuto
Entonces se dispara la alerta "InstanciaCaida" con severidad SEV1 y se ve en Prometheus/Grafana
  Y el simulacro se documenta con línea de tiempo y post-mortem en docs/incidentes/
```

#### CA-7 — Dashboards provisionados *(TS-05)*
```gherkin
Dado un ambiente con el perfil "monitoring"
Cuando se ejecuta docker compose --profile monitoring up
Entonces Grafana arranca con el dashboard "Salud del servicio" y Jaeger permite ver las trazas, sin configuración manual
```

### Pruebas automatizadas

#### CA-8 — Informe de cobertura *(TS-06, RNF-08)*
```gherkin
Dado que el pipeline de CI se ejecuta
Cuando corren las pruebas unitarias y de integración
Entonces se genera el reporte de cobertura (JaCoCo y Vitest)
  Y la cobertura de líneas del backend es ≥ 70 % (≥ 80 % en service/workflow) o el build falla
```

#### CA-9 — Trazabilidad criterios → pruebas *(TS-06)*
```gherkin
Dado los escenarios BDD de los specs 01 a 05 y 09
Cuando se revisa la matriz de trazabilidad
Entonces el 100 % de los escenarios Must tienen al menos una prueba (automática o caso manual UAT) identificada por su CA-n
```

#### CA-10 — Pruebas contra MySQL real *(TS-06)*
```gherkin
Dado las pruebas de integración de persistencia
Cuando se ejecutan
Entonces usan un contenedor MySQL 8.0 efímero (Testcontainers) con las migraciones reales
  Y verifican constraints y las consultas del dashboard
```

#### CA-11 — Pruebas de API automatizadas *(TS-06)*
```gherkin
Dado la colección de API versionada (Bruno)
Cuando se ejecuta en CI y tras cada despliegue a staging
Entonces recorre los flujos de cada HU y los casos negativos de códigos HTTP
  Y genera un reporte adjunto al PR/informe
```

#### CA-12 — Pruebas de autorización *(TS-06, RNF-01)*
```gherkin
Dado la matriz de autorización de la API
Cuando corre la suite parametrizada rol × endpoint × recurso propio/ajeno
Entonces el 100 % de las combinaciones devuelve el código esperado (200/201/204, 403 o 404)
```

#### CA-13 — Pruebas de frontend *(TS-06)*
```gherkin
Dado los componentes críticos (formularios, AuthContext, rutas protegidas, FileUploader, acciones por permiso)
Cuando se ejecuta "npm test"
Entonces las validaciones, estados de carga/error y redirecciones se verifican con Vitest y Testing Library
```

#### CA-14 — Pruebas generadas con IA revisadas *(TS-06)*
```gherkin
Dado una prueba generada con IA
Cuando se prepara el PR
Entonces se verifica con la lista de [Estrategia §10.2], se prueba que FALLA cuando se rompe el código, y se registra en el Registro de IA
```

### Carga y estrés

#### CA-15 — Carga nominal *(TS-07, RNF-02)*
```gherkin
Dado el ambiente de staging con ~2 000 solicitudes sembradas
Cuando k6 ejecuta el escenario Login → Obtener token → Crear solicitudes → Consultar con 50 usuarios virtuales durante 5 minutos
Entonces el percentil 95 de las peticiones (excepto login) es ≤ 300 ms
  Y el login tiene P95 ≤ 800 ms
  Y la tasa de error es < 1 %
```

#### CA-16 — Estrés y recuperación *(TS-07)*
```gherkin
Dado una rampa de carga hasta 500 usuarios virtuales
Cuando el sistema alcanza su límite
Entonces se registra el nivel de carga donde P95 supera 1 s o el error supera 5 %
  Y al reducir la carga el sistema se recupera solo, sin reinicio manual y sin pérdida de datos
```

#### CA-17 — *(retirado)*
*La prueba de pico de demanda salió del alcance el 03/10/2026 (basta carga nominal y estrés). La numeración CA se conserva.*

#### CA-18 — Informe de resultados *(TS-07)*
```gherkin
Cuando terminan las pruebas de carga
Entonces el informe incluye latencia P50/P95/P99, throughput, errores, uso de CPU/memoria/pool, los cuellos de botella observados y las acciones de mejora
```

---

## 4. Matriz de trazabilidad

| Criterio | Historia | Verificación |
|:---|:---:|:---|
| CA-1, CA-2, CA-3 | TS-05 | TC-028; prueba de logs; revisión |
| CA-4, CA-5 | TS-05 | `curl` interno; prueba de BD caída |
| CA-6, CA-7 | TS-05 | Simulacro y capturas de Grafana |
| CA-8, CA-9, CA-10 | TS-06 | JaCoCo/Vitest; matriz de trazabilidad |
| CA-11, CA-12, CA-13 | TS-06 | Bruno, suite de autorización, Vitest |
| CA-14 | TS-06 | Registro de IA y revisión de la prueba |
| CA-15, CA-16, CA-18 | TS-07 | TC-031, TC-032; informe k6 |
