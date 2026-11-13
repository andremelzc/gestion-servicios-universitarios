# Evidencias de la Fase III (Release Candidate)

> Índice de evidencias al 13/11/2026. Lo marcado **Pendiente** no tiene evidencia y no se da por cumplido.

| Requisito del enunciado | Evidencia | Estado |
|:---|:---|:---|
| Aplicación desplegada | Frontend de staging `https://frontend-servicios-2o4nr29q3.vercel.app` ([captura](staging-login.jpg)). Backend de producción `https://backend-servicios-75nb.onrender.com`: `/actuator/health` → `UP` (13/11/2026). Backend de staging `https://backend-servicios-staging.onrender.com`: la API responde (`POST /api/v1/auth/login` con credenciales inválidas → 401, 13/11/2026); `/actuator/health` responde 500 porque Actuator escucha en el puerto de gestión 8081, que Render no publica | **Hecho; falta publicar el health en Render** |
| API documentada | Swagger UI ([captura](swagger-ui-dev.jpg), perfil `dev`; 38 rutas) y contrato [`openapi.yaml`](openapi.yaml), generado desde `/v3/api-docs`. Swagger está desactivado en producción | Hecho |
| CI/CD | [CI en develop](https://github.com/andremelzc/gestion-servicios-universitarios/actions/runs/40566834644) · [Seguridad](https://github.com/andremelzc/gestion-servicios-universitarios/actions/runs/43363285839) · [CD staging](https://github.com/andremelzc/gestion-servicios-universitarios/actions/runs/43472935314) · [CD prod](https://github.com/andremelzc/gestion-servicios-universitarios/actions/runs/40592126003) | Hecho |
| Autenticación y autorización | Suite `AuthAuthorizationIT` y matriz en [Informe de pruebas](../../../INFORME_PRUEBAS.md) | Hecho |
| Seguridad | CodeQL y gitleaks en `security.yml`; [ZAP baseline](https://github.com/andremelzc/gestion-servicios-universitarios/actions/runs/43472935314/job/132053512566) (artefacto `zap-baseline-staging-report` en esa ejecución); [estado del hardening](#estado-del-checklist-de-hardening-103) | Hecho (con hallazgos abiertos) |
| Pruebas y automatización | Artefactos `backend-coverage-report` y `frontend-coverage-report` de [esa misma ejecución](https://github.com/andremelzc/gestion-servicios-universitarios/actions/runs/43472935314); colección Bruno en `api-tests/`; [Informe de pruebas](../../../INFORME_PRUEBAS.md) | Hecho |
| Release `v0.9.0-rc.1` | No existe tag ni release en GitHub | **Pendiente** |

Limitaciones: la captura de Swagger es del perfil `dev` en local (en producción está desactivado por diseño) y la captura de staging muestra solo la pantalla de login.

## Estado del checklist de hardening (§10.3)

Verificado leyendo el código y probando la URL de producción el 13/11/2026.

| Ítem | Verificado | Falta |
|:---|:---|:---|
| `prod` sin Swagger, `/v3/api-docs` ni detalle de errores | Sí, en código y en producción (`/swagger-ui`, `/v3/api-docs`, `/actuator/env` no accesibles) | — |
| `/actuator/prometheus` no accesible desde Internet | **Estaba público en producción** (200 sin token). Corregido (`SecurityConfig`, PR #400) y verificado en producción tras el despliegue desde `main`: ahora responde 403 | — |
| CORS sin `*` | Se configura con `ALLOWED_ORIGINS` | Confirmar el valor en producción |
| Cabeceras de seguridad | CSP en `frontend/nginx/default.conf`; el backend de producción envía HSTS, `X-Content-Type-Options` y `X-Frame-Options` | Revisar CSP en el frontend desplegado |
| TLS y redirección HTTP→HTTPS | Lo gestionan Vercel y Render; hay `Strict-Transport-Security` | Comprobar la redirección HTTP |
| BD sin DDL en `prod` | Variables `FLYWAY_USER`/`DB_USER` separadas | Comprobar en el proveedor de BD |
| Contenedores sin root; BD no publicada | `USER spring` en el Dockerfile del backend | Revisar frontend y compose |
| `gitleaks` limpio en todo el historial | `security.yml` corre y pasa | Confirmar que escanea el historial completo |
| Contraseñas por defecto cambiadas | — | Verificar en el proveedor |
| Usuarios demo | — | Decisión tras la sustentación |

**Hallazgos abiertos al 13/11/2026:** (1) en Render, `/actuator/health` responde 500 en producción y staging porque Actuator usa el puerto 8081; se resuelve definiendo `MANAGEMENT_PORT` con el mismo valor que el puerto de la aplicación en ambos servicios (con el arreglo de Prometheus, `/actuator/prometheus` sigue protegido); (2) rutas inexistentes y métodos no permitidos devuelven 500 en lugar de 404/405.
