# Evidencias de la Fase III (Release Candidate)

> Índice de evidencias existentes al 13/11/2026. Lo marcado **Pendiente** no tiene evidencia en el repositorio y no se ha dado por cumplido.

| Requisito del enunciado | Evidencia | Estado |
|:---|:---|:---|
| Aplicación desplegada | Backend prod `https://backend-servicios-75nb.onrender.com`: `/actuator/health` → `UP` (13/11/2026). Frontend en staging `https://frontend-servicios-2o4nr29q3.vercel.app` ([DevOps §9](../devops-despliegue.md#9-plataforma-cloud-y-github-environments-ops-22--118)). Backend staging `https://backend-servicios-staging.onrender.com`: **responde 500 en todas las rutas** (13/11/2026). [Nota UAT](../evidencia-uat-09-10.md). | **Parcial: staging con fallo; falta captura** |
| API documentada | Swagger UI en `dev`/`test`; contrato en [API REST](../../02-diseno/api-rest.md) | Hecho (falta adjuntar `openapi.yaml` al release) |
| CI/CD | [CI en develop](https://github.com/andremelzc/gestion-servicios-universitarios/actions/runs/40566834644) · [Seguridad](https://github.com/andremelzc/gestion-servicios-universitarios/actions/runs/43363285839) · [CD staging](https://github.com/andremelzc/gestion-servicios-universitarios/actions/runs/43363285861) · [CD prod](https://github.com/andremelzc/gestion-servicios-universitarios/actions/runs/40592126003) | Hecho |
| Autenticación y autorización | Suite `AuthAuthorizationIT` y matriz en [Informe de pruebas](../../INFORME_PRUEBAS.md) | Hecho |
| Seguridad | CodeQL y gitleaks en `security.yml`; ZAP baseline en `cd-staging.yml`; checklist OPS-32 ([estado](#estado-del-checklist-de-hardening-103)) | **Pendiente firma de R1 y R6** |
| Pruebas y automatización | Cobertura y k6 en [Informe de pruebas](../../INFORME_PRUEBAS.md); colección Bruno en `api-tests/` | Hecho |
| Release `v0.9.0-rc.1` | No existe tag ni release en GitHub | **Pendiente** |

## Estado del checklist de hardening (§10.3)

Verificado leyendo el código; **no equivale a la firma ni a la verificación contra el entorno desplegado.**

| Ítem | Verificado en código | Falta |
|:---|:---|:---|
| `prod` sin Swagger, `/v3/api-docs` ni detalle de errores | Sí, y comprobado en producción: `/swagger-ui`, `/v3/api-docs` y `/actuator/env` no son accesibles (500 genérico sin detalle) | — |
| `/actuator/prometheus` no accesible desde Internet | Nginx lo bloquea en Compose | **FALLA en producción:** `GET https://backend-servicios-75nb.onrender.com/actuator/prometheus` devuelve 200 sin autenticación (13/11/2026) |
| CORS sin `*` | Se configura con `ALLOWED_ORIGINS` | Confirmar el valor en producción |
| Cabeceras de seguridad | CSP en `frontend/nginx/default.conf`; el backend de producción envía HSTS, `X-Content-Type-Options` y `X-Frame-Options` | Revisar CSP en el frontend desplegado |
| TLS y redirección HTTP→HTTPS | Lo gestionan Vercel y Render; la respuesta de producción trae `Strict-Transport-Security` | Comprobar la redirección HTTP |
| BD sin DDL en `prod` | Variables `FLYWAY_USER`/`DB_USER` separadas | Comprobar en el proveedor de BD |
| Contenedores sin root; BD no publicada | `USER spring` en el Dockerfile del backend | Revisar frontend y compose |
| `gitleaks` limpio en todo el historial | `security.yml` corre y pasa | Confirmar que escanea el historial completo |
| Contraseñas por defecto cambiadas | — | Verificar en el proveedor |
| Usuarios demo | — | Decisión tras la sustentación |

**Hallazgos abiertos al 13/11/2026:** (1) `/actuator/prometheus` público en producción; (2) backend de staging devuelve 500 en todas las rutas; (3) rutas inexistentes y métodos no permitidos devuelven 500 en lugar de 404/405.
