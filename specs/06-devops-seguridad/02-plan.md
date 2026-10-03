# Plan 06 — Diseño técnico de DevOps, API documentada y Seguridad

> Este plan **no duplica** los documentos de referencia; define qué archivos se crean y las decisiones de configuración por herramienta. Fuentes: [DevOps y despliegue](../../docs/03-calidad-y-operacion/devops-despliegue.md) (contenedores, ambientes, pipeline, variables, Nginx) · [Seguridad y OWASP](../../docs/03-calidad-y-operacion/seguridad-owasp.md) (matriz, subida de archivos, secretos, cabeceras, checklist) · [API REST §7–§8](../../docs/02-diseno/api-rest.md#7-documentación-ejecutable-openapi--swagger).

## 1. Archivos y carpetas a crear

| Ruta | Contenido | Responsable |
|:---|:---|:---:|
| `backend/Dockerfile`, `frontend/Dockerfile`, `.dockerignore` | Imágenes multi-stage, usuario no root, `HEALTHCHECK` | R6 |
| `docker-compose.yml`, `docker-compose.{dev,prod,monitoring}.yml` | Orquestación y *overrides* por ambiente | R6 |
| `.env.example`, `.gitignore` | Plantilla de variables y exclusiones | R1 |
| `frontend/nginx/default.conf` | API Gateway: proxy, cabeceras, `limit_req`, TLS | R6 |
| `.github/workflows/ci.yml`, `security.yml`, `cd-staging.yml`, `cd-prod.yml` | Pipelines ([DevOps §4](../../docs/03-calidad-y-operacion/devops-despliegue.md#4-pipeline-cicd-github-actions)) | R6 / R1 |
| `.github/dependabot.yml`, `.github/CODEOWNERS` | Actualización de dependencias y revisores | R1 |
| `backend/src/main/java/.../config/OpenApiConfig.java` | Metadatos de OpenAPI y esquema `bearerAuth` | R2 |
| `openapi.yaml` | Contrato exportado por *release* | R2/R3 |
| `ops/` | Prometheus, alertas, Grafana ([Observabilidad](../../docs/03-calidad-y-operacion/observabilidad.md)) | R6 |

## 2. Decisiones de configuración

### 2.1 Backend (Maven)
- **JaCoCo:** `jacoco-maven-plugin` con `check` en la fase `verify`: regla global `LINE ≥ 0.70`.
- **Pruebas de integración:** `maven-failsafe-plugin` para `*IT` (Testcontainers MySQL 8.0 con Flyway).
- **springdoc:** `springdoc.api-docs.enabled=${SWAGGER_ENABLED:false}` y `springdoc.swagger-ui.enabled=${SWAGGER_ENABLED:false}` (activo en `dev`/`test`, apagado en `prod` por defecto).
- **Arranque seguro:** `@ConfigurationProperties` validado con `@NotBlank`/`@Size(min=32)` para `app.jwt.secret`.
- **Imagen:** `spring-boot:build-image` o Dockerfile con capas (`layertools`); `JAVA_TOOL_OPTIONS=-Duser.timezone=UTC -XX:MaxRAMPercentage=75`.

### 2.2 Frontend (npm)
- Scripts: `lint`, `test` (= `vitest run`), `test:coverage`, `build`. `npm ci` en CI.
- `VITE_API_URL` solo como argumento de *build* (`/api/v1`).
- Plugin de *build* sin *source maps* en `prod` (o subidos a un almacén privado).

### 2.3 Seguridad en el pipeline
| Herramienta | Configuración clave |
|:---|:---|
| **CodeQL** | Lenguajes `java-kotlin` y `javascript-typescript`; consultas `security-extended`; bloquea alta/crítica |
| **gitleaks** | `gitleaks detect` en CI sobre el historial completo en la primera ejecución; *pre-commit* local |
| **ZAP** | `zaproxy/action-baseline` contra la URL de *staging*; reglas ajustadas en `.zap/rules.tsv` |
| **Dependabot** | Ecosistemas `maven`, `npm`, `github-actions`, `docker`; PR semanales |

### 2.4 Despliegue
- Registro de imágenes: **GHCR**; etiquetas `sha-<commit>` (staging) y `vX.Y.Z` (prod).
- Despliegue por **SSH** a la VM: `docker compose pull && docker compose up -d` con las variables del *GitHub Environment*; luego *smoke test*.
- `concurrency` por ambiente; `permissions` mínimos; secretos nunca impresos.
- Plataforma pendiente de confirmar: [ADR-007](../../docs/02-diseno/decisiones-arquitectura.md#adr-007--plataforma-de-despliegue).

## 3. Verificación
Cada criterio del [spec](01-spec.md#4-matriz-de-trazabilidad) se evidencia con: ejecución del pipeline, salida de las herramientas y capturas en el informe de pruebas (secciones de seguridad y despliegue).

## 4. Riesgos

| Riesgo | Mitigación |
|:---|:---|
| Cloud no decidida bloquea CD y DAST | Decisión antes del 23/10; plan B con Compose local |
| Falsos positivos de SAST/DAST frenan el trabajo | Triaje de hallazgos en la revisión de cada PR, con decisión documentada; supresiones justificadas y versionadas |
| Pipeline lento | Caché de Maven/npm; jobs en paralelo; pruebas de integración solo cuando cambian `backend/` |
| Secretos mal configurados en *Environments* | Checklist de alta de ambiente; *smoke test* que falla si falta una variable obligatoria |
