# Manual técnico y guía de instalación

> Público: quien mantenga o despliegue el sistema. Este manual **consolida y enlaza** las fuentes únicas; no las duplica. Estructura según [Informes §3.3](05-entregables/informes-y-sustentacion.md).

## 1. Visión y arquitectura
Stack: React (SPA) → API REST Spring Boot → MySQL 8. Detalle, capas y patrones en [Arquitectura](02-diseno/arquitectura-tecnica.md); decisiones en [ADRs](02-diseno/decisiones-arquitectura.md).

## 2. Modelo de datos
[Modelo de datos](02-diseno/modelo-datos.md). El esquema lo aplica Flyway al arrancar el backend.

## 3. API
[API REST](02-diseno/api-rest.md). Swagger UI y `/v3/api-docs` solo en `dev`/`test`; desactivados en `prod`.

## 4. Seguridad
[Seguridad y OWASP](03-calidad-y-operacion/seguridad-owasp.md) (incluye el checklist de hardening §10.3).

## 5. Instalación y ejecución local
Prerrequisitos: Docker con Compose, Git. Para correr pruebas fuera de Docker: JDK y Node (versiones en `ci.yml`).

```bash
git clone https://github.com/andremelzc/gestion-servicios-universitarios.git
cd gestion-servicios-universitarios
cp .env.example .env          # completar valores locales; .env no se versiona
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- Datos de demostración: perfil `demo` (`SPRING_PROFILES_ACTIVE=dev,demo`); requiere `DEMO_USER_PASSWORD`. `DEMO_MODO=carga` genera 2 000 solicitudes sintéticas.
- Monitoreo opcional: añadir `-f docker-compose.monitoring.yml` (requiere `GRAFANA_ADMIN_PASSWORD`).
- Pruebas: backend `mvn verify`; frontend `npm ci && npm test`; API con la colección Bruno en `api-tests/`; carga con k6 en `tests/performance/`.

## 6. Configuración
Tabla completa de variables, cuáles son secretas y cuáles obligatorias: [DevOps §5](03-calidad-y-operacion/devops-despliegue.md#5-variables-de-entorno). Plantilla: `.env.example`.

## 7. Despliegue

### 7.1 Ambientes
| Ambiente | URL | Rama / disparador | Quién despliega | Secretos |
|:---|:---|:---|:---|:---|
| **dev** | local (`localhost`) | cualquier rama | cada integrante, con Compose | `.env` local |
| **test** (staging) | Frontend `https://frontend-servicios-2o4nr29q3.vercel.app` · Backend `https://backend-servicios-staging.onrender.com` | `push` a `develop` → `cd-staging.yml` | GitHub Actions | Environment `staging`: `RENDER_STAGING_HOOK`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |
| **prod** | Backend `https://backend-servicios-75nb.onrender.com` (el frontend lo publica Vercel con `vercel deploy --prod`) | `push` a `main` o tag `v*` → `cd-prod.yml` | GitHub Actions (Environment `production`, con aprobación si está configurada) | Environment `production`: `RENDER_DEPLOY_HOOK`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`; variable `PROD_BACKEND_URL` (la usa el smoke test) |

Perfiles Spring: `dev`, `test`, `prod` (+ `demo`) en `backend/src/main/resources/application-*.yml`. Contexto completo: [DevOps §3 y §9](03-calidad-y-operacion/devops-despliegue.md#3-ambientes).

### 7.2 Pipelines
`ci.yml`, `security.yml`, `cd-staging.yml`, `cd-prod.yml` en `.github/workflows/`. Descripción en [DevOps §4](03-calidad-y-operacion/devops-despliegue.md#4-pipeline-cicd-github-actions). Las imágenes se publican en GHCR (`ghcr.io/andremelzc/gestion-servicios-universitarios/{backend,frontend}`) con tags `sha-<commit>`, `prod` y `vX.Y.Z`.

### 7.3 Publicar una versión y revertir
1. Integrar `develop` en `main` (PR).
2. Crear tag `vX.Y.Z` sobre `main` y el release en GitHub con notas.
3. `cd-prod.yml` publica las imágenes y despliega.
4. **Rollback:** redesplegar el tag anterior; las migraciones son aditivas ([DevOps §4.3](03-calidad-y-operacion/devops-despliegue.md#43-versionado-y-releases)).

## 8. Observabilidad y operación
[Observabilidad](03-calidad-y-operacion/observabilidad.md): logs con `traceId`, métricas, trazas, alertas y gestión de incidentes. Simulacro realizado: [INC-20261106-01](incidentes/INC-20261106-01-simulacro-caida-bd-y-backend.md).

## 9. Pruebas
[Estrategia de pruebas](03-calidad-y-operacion/estrategia-pruebas.md), [Informe de pruebas](INFORME_PRUEBAS.md), [E2E del MVP](03-calidad-y-operacion/evidencia-e2e-mvp.md), [UAT-09/10](03-calidad-y-operacion/evidencia-uat-09-10.md).

## 10. Guía del desarrollador
Flujo de ramas, PR y convenciones: [Gobernanza](04-gestion/equipo-y-flujo-de-trabajo.md). Resumen en [DevOps §7](03-calidad-y-operacion/devops-despliegue.md#7-flujo-de-trabajo-del-desarrollador-resumen).

## 11. Problemas conocidos
- Al 13/11/2026 el backend de staging responde 500 en todas sus rutas, incluido `/actuator/health`, y `/actuator/prometheus` es público en producción (ver [evidencias Fase III](03-calidad-y-operacion/evidencias/fase-3.md)).
- Render usa arranque en frío: la primera petición puede tardar más de un minuto.
- El staging de Vercel sirve solo el frontend; el UAT se hizo con Compose local ([evidencia](03-calidad-y-operacion/evidencia-uat-09-10.md)).
