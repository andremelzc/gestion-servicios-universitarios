# Tareas 06 — DevOps, API documentada y Seguridad

> Tareas de planificación: **TASK-001** (repo y CI inicial), **TASK-015** (Docker), **TASK-027** (OpenAPI), **TASK-028** (cloud y CD), **TASK-029** (CI de seguridad), **TASK-019** (hardening). Marcar `[x]` solo al cumplir la [DoD](../../docs/04-gestion/equipo-y-flujo-de-trabajo.md#4-definición-de-hecho-dod).

## Fase 0 — Repositorio · R1

| ☐ | # | Tarea | TS | Evidencia |
|:-:|:-:|:---|:---:|:---|
| [ ] | 0.1 | Crear `develop`; proteger `main` y `develop` ([Gobernanza §1.1](../../docs/04-gestion/equipo-y-flujo-de-trabajo.md#11-ramas-permanentes)) | TS-02 | Captura de la configuración |
| [ ] | 0.2 | `.gitignore` (incluye `.env`, `target/`, `node_modules/`, volúmenes) y `.env.example` completo | TS-04 | `gitleaks` limpio |
| [ ] | 0.3 | `CODEOWNERS`, plantillas de issue (bug, tarea técnica) y `dependabot.yml` | TS-02 | Archivos en `.github/` |

## Fase 1 — Contenerización · R6

| ☐ | # | Tarea | TS | Evidencia |
|:-:|:-:|:---|:---:|:---|
| [x] | 1.1 | `backend/Dockerfile` multi-stage con capas, usuario no root y `HEALTHCHECK` | TS-01 | CA-3 |
| [x] | 1.2 | `frontend/Dockerfile` multi-stage (Node → Nginx) con `VITE_API_URL` como `ARG` | TS-01 | CA-1 |
| [x] | 1.3 | `docker-compose.yml` base (db, backend, frontend) con `depends_on: condition: service_healthy`, volúmenes y `restart` | TS-01 | CA-1, CA-2 |
| [x] | 1.4 | Overrides `dev` (puertos abiertos) y `prod` (sin puerto de BD, límites de recursos) | TS-01 | CA-3 |
| [x] | 1.5 | `frontend/nginx/default.conf`: proxy `/api/`, cabeceras, `limit_req`, `client_max_body_size`, `/actuator` bloqueado | TS-04 | CA-8, CA-9, CA-10 |
| [x] | 1.6 | Probar `docker compose up --build` en una máquina limpia | TS-01 | TC-033 (video/capturas) |

## Fase 2 — Seguridad aplicativa · R1 / R6

| ☐ | # | Tarea | TS | Evidencia |
|:-:|:-:|:---|:---:|:---|
| [x] | 2.1 | `application.yml` solo con `${VARIABLES}`; validación de arranque de `JWT_SECRET` | TS-04 | CA-5 |
| [ ] | 2.2 | `@Valid` en todos los endpoints POST/PUT y `GlobalExceptionHandler` (RFC 7807) | TS-04 | CA-6 |
| [ ] | 2.3 | `@SinHtml` en todos los campos de texto libre; *payloads* de prueba | TS-04 | CA-6 (TC-011) |
| [ ] | 2.4 | CORS global por `ALLOWED_ORIGINS` en Spring Security | TS-04 | CA-7 |
| [ ] | 2.5 | Lista blanca de campos de ordenamiento y tope de paginación | TS-04 | CA-6 |
| [ ] | 2.6 | Desactivar Swagger/errores detallados en `prod`; Actuator restringido | TS-04 | CA-10 |
| [ ] | 2.7 | Checklist de hardening firmado ([Seguridad §10.3](../../docs/03-calidad-y-operacion/seguridad-owasp.md#103-checklist-de-hardening-previo-al-release)) | TS-04 | Checklist completo |

## Fase 3 — CI y calidad · R6

| ☐ | # | Tarea | TS | Evidencia |
|:-:|:-:|:---|:---:|:---|
| [x] | 3.1 | `ci.yml`: jobs `backend`, `frontend`, `docker-build`; **sin** el atajo "omitir si no existe" ([diagnóstico](../../docs/03-calidad-y-operacion/devops-despliegue.md#44-estado-actual-del-ci-diagnóstico-y-pendientes)) | TS-02 | CA-11 |
| [x] | 3.2 | JaCoCo con umbral de 70 % global y Vitest coverage | TS-02 | CA-12 |
| [x] | 3.3 | Caché de Maven y npm (`cache: npm`); `npm test` = `vitest run` | TS-02 | Tiempos de CI |
| [x] | 3.4 | Reglas de protección: checks requeridos `backend`, `frontend`, `security` | TS-02 | CA-11 |

## Fase 4 — SAST/DAST y dependencias · R6

| ☐ | # | Tarea | TS | Evidencia |
|:-:|:-:|:---|:---:|:---|
| [x] | 4.1 | `security.yml`: CodeQL y gitleaks (Dependabot cubre las dependencias) | TS-08 | CA-16, CA-17 (PR de prueba bloqueado) |
| [ ] | 4.2 | `.zap/rules.tsv` y job ZAP baseline tras desplegar a *staging* | TS-08 | CA-18 |

## Fase 5 — CD y cloud · R1 / R6

| ☐ | # | Tarea | TS | Evidencia |
|:-:|:-:|:---|:---:|:---|
| [ ] | 5.1 | **Confirmar la plataforma** y completar [ADR-007](../../docs/02-diseno/decisiones-arquitectura.md#adr-007--plataforma-de-despliegue) y [DevOps §9](../../docs/03-calidad-y-operacion/devops-despliegue.md#9-plataforma-cloud) (antes del 23/10) | TS-03 | ADR actualizado |
| [ ] | 5.2 | Aprovisionar VM/servicios, TLS (Let's Encrypt), dominio y *firewall* | TS-03 | Checklist [DevOps §8](../../docs/03-calidad-y-operacion/devops-despliegue.md#8-operación-del-host) |
| [ ] | 5.3 | GitHub Environments `staging` y `production` con secretos propios | TS-03 | CA-4 |
| [ ] | 5.4 | `cd-staging.yml`: GHCR, despliegue SSH, *smoke test* y ZAP | TS-03 | CA-13 |
| [ ] | 5.5 | `cd-prod.yml`: despliegue por tag y *smoke test* | TS-03 | CA-14 |

## Fase 6 — API documentada · R2 / R3

| ☐ | # | Tarea | TS | Evidencia |
|:-:|:-:|:---|:---:|:---|
| [ ] | 6.1 | springdoc + `OpenApiConfig` (metadatos, `bearerAuth`) con `SWAGGER_ENABLED` por perfil | TS-09 | CA-10, CA-19 |
| [ ] | 6.2 | `@Operation`/`@ApiResponse`/ejemplos en el 100 % de los endpoints | TS-09 | CA-19 |
| [ ] | 6.3 | Exportar `openapi.yaml` versionado por *release* | TS-09 | CA-19 |

## Fase 7 — IA · todos
- [ ] 7.1 Registrar en el [Registro de IA](../../docs/04-gestion/ia-register.md) todo uso de IA en Dockerfiles, *workflows* y configuración de seguridad, con la validación realizada.
