# Backlog 07 — DevOps, API documentada y Seguridad

> Convenciones: [README](README.md). Fuente: [`specs/06-devops-seguridad/03-tasks.md`](../../specs/06-devops-seguridad/03-tasks.md) · [DevOps](../03-calidad-y-operacion/devops-despliegue.md) · [Seguridad OWASP](../03-calidad-y-operacion/seguridad-owasp.md). TASK-015, 019, 027, 028, 029 y 036. Fase III del enunciado: aplicación desplegada, API documentada, CI/CD, autenticación, autorización, seguridad, pruebas y evidencias de automatización.

## Contenerización (R6)

### OPS-01 · [DevOps] Backend - `Dockerfile` multi-stage
**Rol:** R6 · **Labels:** `devops` `TS-01` `TASK-015` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.1 · **Bloqueado por:** BASE-03
- [ ] Multi-stage con capas de Spring Boot, usuario no root y `HEALTHCHECK`

**Aceptación:** CA-3; imagen construye y responde en `/actuator/health`.

### OPS-02 · [DevOps] Frontend - `Dockerfile` multi-stage (Node → Nginx)
**Rol:** R5 · **Labels:** `devops` `TS-01` `TASK-015` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.1 · **Bloqueado por:** BASE-04
- [ ] `VITE_API_URL` como `ARG`

**Aceptación:** CA-1.

### OPS-03 · [DevOps] `docker-compose.yml` base
**Rol:** R6 · **Labels:** `devops` `TS-01` `TASK-015` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.1 · **Bloqueado por:** OPS-01, OPS-02
- [ ] Servicios `db`, `backend`, `frontend`; `depends_on: condition: service_healthy`, volúmenes y `restart`

**Aceptación:** CA-1, CA-2.

### OPS-04 · [DevOps] Overrides `dev` y `prod` de Compose
**Rol:** R6 · **Labels:** `devops` `TS-01` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.1 · **Bloqueado por:** OPS-03
- [ ] `dev`: puertos abiertos · `prod`: sin puerto de BD y límites de recursos

**Aceptación:** CA-3.

### OPS-05 · [DevOps] Nginx como API Gateway (`default.conf`)
**Rol:** R5 · **Labels:** `devops` `seguridad` `TS-04` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.1 · **Bloqueado por:** OPS-02
- [ ] Proxy `/api/` → `backend:8080`, cabeceras de seguridad, `limit_req`, `client_max_body_size` (alineado con `REG-10`), `/actuator` bloqueado
- [ ] Documentar el rol de gateway ([API §8.1](../02-diseno/api-rest.md#81-api-gateway), [ADR-006](../02-diseno/decisiones-arquitectura.md#adr-006--nginx-como-api-gateway-ligero))

**Aceptación:** CA-8, CA-9, CA-10.

### OPS-06 · [DevOps] Probar `docker compose up --build` en máquina limpia
**Rol:** R6 · **Labels:** `devops` `qa` `TS-01` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.1 · **Bloqueado por:** OPS-04, OPS-05

**Aceptación:** TC-033 (video o capturas).

## Seguridad aplicativa (R1; pruebas R6)

### OPS-07 · [Seguridad] Backend - `application.yml` solo con `${VARIABLES}`
**Rol:** R1 · **Labels:** `backend` `seguridad` `TS-04` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.4 · **Bloqueado por:** BASE-03
- [ ] Revisar que no haya *hardcode* de URLs, claves ni credenciales
- [ ] Validación de arranque de `JWT_SECRET`

**Aceptación:** CA-5.

### OPS-08 · [Seguridad] Backend - Auditoría de `@Valid` en todos los POST/PUT
**Rol:** R2 · **Labels:** `backend` `seguridad` `TS-04` · **Sprint:** S3 · **Milestone:** 2.4 Cloud, CD, hardening y Release Candidate · **Límite:** 04/11 · **Bloqueado por:** AUTH-09, GES-14
- [ ] Verificar `@Valid` en cada request body y que el error salga en RFC 7807

**Aceptación:** CA-6.

### OPS-09 · [Seguridad] QA - `@SinHtml` en todo texto libre y payloads de prueba
**Rol:** R6 · **Labels:** `qa` `seguridad` `TS-04` · **Sprint:** S3 · **Milestone:** 2.4 Cloud, CD, hardening y Release Candidate · **Límite:** 04/11 · **Bloqueado por:** OPS-08
- [ ] Lista de campos de texto libre con `@SinHtml`; pruebas con *payloads* XSS

**Aceptación:** CA-6 (TC-011).

### OPS-10 · [Seguridad] Backend - Verificar CORS por `ALLOWED_ORIGINS`
**Rol:** R1 · **Labels:** `backend` `seguridad` `TS-04` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.4 · **Bloqueado por:** AUTH-08
- [ ] Prueba con origen permitido y no permitido en cada perfil

**Aceptación:** CA-7. (La configuración se crea en `AUTH-08`.)

### OPS-11 · [Seguridad] Backend - Lista blanca de ordenamiento y tope de paginación
**Rol:** R2 · **Labels:** `backend` `seguridad` `TS-04` · **Sprint:** S3 · **Milestone:** 2.4 Cloud, CD, hardening y Release Candidate · **Límite:** 04/11 · **Bloqueado por:** REG-11, GES-09
- [ ] Campos de `sort` permitidos por recurso y `size` máximo

**Aceptación:** CA-6.

### OPS-31 · [Seguridad] Backend - Swagger, errores detallados y Actuator restringidos en `prod`
**Rol:** R1 · **Labels:** `backend` `seguridad` `TS-04` · **Sprint:** S3 · **Milestone:** 2.4 Cloud, CD, hardening y Release Candidate · **Límite:** 04/11 · **Bloqueado por:** OPS-27
- [ ] Desactivar Swagger y mensajes de error detallados en `prod`; Actuator solo `health`

**Aceptación:** CA-10 (verificado desde fuera).

### OPS-32 · [Seguridad] Checklist de hardening firmado (TASK-019)
**Rol:** R1 · **Labels:** `seguridad` `TS-04` `TASK-019` · **Sprint:** S3 · **Milestone:** 2.4 Cloud, CD, hardening y Release Candidate · **Límite:** 04/11 · **Bloqueado por:** OPS-07…OPS-11, OPS-31, OPS-23
- [ ] Completar [Seguridad §10.3](../03-calidad-y-operacion/seguridad-owasp.md#103-checklist-de-hardening-previo-al-release): CSP/CORS/cabeceras, *rate limit*, secretos
- [ ] Firma de R1 y R6

**Aceptación:** checklist completo y enlazado en `DOC-08`.

## CI y calidad (R6)

### OPS-12 · [DevOps] CI - `ci.yml` con jobs `backend`, `frontend`, `docker-build`
**Rol:** R6 · **Labels:** `devops` `TS-02` `TASK-001` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** BASE-03, BASE-04
- [ ] Quitar el atajo "omitir si no existe" ([diagnóstico](../03-calidad-y-operacion/devops-despliegue.md#44-estado-actual-del-ci-diagnóstico-y-pendientes)); los jobs deben **fallar** si falta el proyecto

**Aceptación:** CA-11.

### OPS-13 · [DevOps] CI - JaCoCo y Vitest con umbrales de cobertura
**Rol:** R6 · **Labels:** `devops` `qa` `TS-02` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.1 · **Bloqueado por:** OPS-12
- [ ] 70 % global; cobertura de Vitest
- [ ] Reporte de cobertura adjunto en cada PR

**Aceptación:** CA-12.

### OPS-14 · [DevOps] CI - Caché de Maven y npm, `npm test = vitest run`
**Rol:** R6 · **Labels:** `devops` `TS-02` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.1 · **Bloqueado por:** OPS-12

**Aceptación:** comparación de tiempos de CI antes/después.

### OPS-15 · [DevOps] CI - Reglas de protección con checks requeridos
**Rol:** R6 · **Labels:** `devops` `TS-02` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.2 · **Bloqueado por:** OPS-12, OPS-16
- [ ] Checks requeridos `backend`, `frontend`, `security` en `main` y `develop`

**Aceptación:** CA-11.

## SAST, DAST y dependencias (R6)

### OPS-16 · [Seguridad] CI - `security.yml` (CodeQL y gitleaks)
**Rol:** R6 · **Labels:** `devops` `seguridad` `TS-08` `TASK-029` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.2 · **Bloqueado por:** OPS-01
- [ ] Un job por herramienta; fallo ante hallazgo crítico/alto
- [ ] Las dependencias las vigila Dependabot (ver `BASE-02`)

**Aceptación:** CA-16, CA-17 (PR de prueba bloqueado).

### OPS-17 · [Seguridad] DAST - ZAP *baseline* tras desplegar a *staging*
**Rol:** R6 · **Labels:** `devops` `seguridad` `TS-08` · **Sprint:** S3 · **Milestone:** 2.4 Cloud, CD, hardening y Release Candidate · **Límite:** 04/11 · **Bloqueado por:** OPS-23
- [ ] `.zap/rules.tsv` y job ZAP *baseline* en el pipeline de *staging*

**Aceptación:** CA-18.


## CD y cloud (R1 / R6)

### OPS-20 · [DevOps] Decidir la plataforma cloud (ADR-007)
**Rol:** R1 · **Labels:** `devops` `TS-03` `decisión` · **Sprint:** S2 · **Milestone:** 2.1 Decisión de cloud y entorno de staging · **Límite:** 23/10 · **Bloqueado por:** —
- [ ] Elegir plataforma y completar [ADR-007](../02-diseno/decisiones-arquitectura.md#adr-007--plataforma-de-despliegue) y [DevOps §9](../03-calidad-y-operacion/devops-despliegue.md#9-plataforma-cloud)
- [ ] Definir plan B (Docker Compose local documentado)

**Aceptación:** ADR actualizado. **Bloquea:** OPS-21…OPS-24 y los pasos de *deploy* del release.

### OPS-21 · [DevOps] Aprovisionar VM/servicios, TLS, dominio y *firewall*
**Rol:** R6 · **Labels:** `devops` `TS-03` `TASK-028` · **Sprint:** S2 · **Milestone:** 2.1 Decisión de cloud y entorno de staging · **Límite:** 23/10 · **Bloqueado por:** OPS-20, OPS-04
- [ ] Servidor, TLS (Let's Encrypt), dominio y *firewall*

**Aceptación:** checklist de [DevOps §8](../03-calidad-y-operacion/devops-despliegue.md#8-operación-del-host).

### OPS-22 · [DevOps] GitHub Environments `staging` y `production`
**Rol:** R6 · **Labels:** `devops` `TS-03` · **Sprint:** S2 · **Milestone:** 2.1 Decisión de cloud y entorno de staging · **Límite:** 23/10 · **Bloqueado por:** OPS-20
- [ ] Secretos propios por entorno

**Aceptación:** CA-4.

### OPS-23 · [DevOps] `cd-staging.yml` (GHCR, SSH, *smoke test*)
**Rol:** R6 · **Labels:** `devops` `TS-03` `TASK-028` · **Sprint:** S3 · **Milestone:** 2.4 Cloud, CD, hardening y Release Candidate · **Límite:** 04/11 · **Bloqueado por:** OPS-21, OPS-22, OPS-16
- [ ] Publicar imágenes en GHCR; despliegue por SSH; *smoke test*; disparar ZAP

**Aceptación:** CA-13 (despliegue automático desde `develop`).

### OPS-24 · [DevOps] `cd-prod.yml` (despliegue por tag y *smoke test*)
**Rol:** R1 · **Labels:** `devops` `TS-03` `TASK-028` · **Sprint:** S3 · **Milestone:** 2.4 Cloud, CD, hardening y Release Candidate · **Límite:** 04/11 · **Bloqueado por:** OPS-23
- [ ] Desplegar las imágenes del *tag* `vX.Y.Z`; *smoke test*

**Aceptación:** CA-14.



## API documentada (R2 / R3)

### OPS-27 · [API] Backend - springdoc y `OpenApiConfig`
**Rol:** R3 · **Labels:** `backend` `API` `TS-09` `TASK-027` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.2 · **Bloqueado por:** AUTH-08
- [ ] Metadatos, esquema `bearerAuth`, `SWAGGER_ENABLED` por perfil

**Aceptación:** CA-10, CA-19.

### OPS-28 · [API] Backend - `@Operation`, `@ApiResponse` y ejemplos en el 100 % de endpoints
**Rol:** R2 · **Labels:** `backend` `API` `TS-09` · **Sprint:** S2 · **Milestone:** 2.2 Gestión completa, Dashboard y API documentada · **Límite:** 28/10 · **Bloqueado por:** OPS-27
- [ ] Revisar cada controlador (auth, solicitudes, dashboard, admin) y completar lo faltante
- [ ] Exportar `openapi.yaml` versionado por *release* (sin prueba de contrato en CI)

**Aceptación:** CA-19.



## Ambientes y panorama de API

### OPS-33 · [DevOps] Ambientes desarrollo / prueba / producción
**Rol:** R1 · **Labels:** `devops` `TS-03` `TS-01` · **Sprint:** S3 · **Milestone:** 2.4 Cloud, CD, hardening y Release Candidate · **Límite:** 04/11 · **Bloqueado por:** OPS-04, OPS-22
El enunciado exige ambientes de desarrollo, prueba y producción; esto asegura que estén definidos, separados y documentados ([DevOps §3](../03-calidad-y-operacion/devops-despliegue.md#3-ambientes)).
- [ ] Perfiles `dev`, `test` y `prod` de Spring y de Compose con sus variables (sin secretos en el repo)
- [ ] Mapear cada ambiente: local (dev) · CI/`staging` (prueba) · `production`; datos de cada uno (seed vs. datos reales)
- [ ] Tabla "ambiente → URL → rama → quién despliega → secretos" en el manual técnico
- [ ] Verificar que `dev` usa Swagger, y que `prod` no (ver `OPS-31`)

**Aceptación:** los 3 ambientes arrancan con su configuración y la tabla está en `DOC-05`.

### OPS-34 · [API] Docs - Panorama de GraphQL / gRPC / webhooks y API Gateway
**Rol:** R2 · **Labels:** `docs` `API` `TS-09` · **Sprint:** S3 · **Milestone:** 2.4 Cloud, CD, hardening y Release Candidate · **Límite:** 04/11 · **Bloqueado por:** OPS-05, OPS-27
El enunciado pide el "panorama de GraphQL/gRPC/webhooks" y el API Gateway. La base está en [API §8](../02-diseno/api-rest.md#8-panorama-de-estilos-de-api-y-api-gateway) y [ADR-006](../02-diseno/decisiones-arquitectura.md#adr-006--nginx-como-api-gateway-ligero).
- [ ] Revisar y completar la comparación REST vs GraphQL vs gRPC vs webhooks (cuándo usar cada uno y por qué el proyecto usa REST)
- [ ] Ejemplo ilustrativo de un webhook (p. ej. notificar un cambio de estado a un sistema externo) con firma HMAC y lista blanca de destinos (SSRF, [Seguridad A10](../03-calidad-y-operacion/seguridad-owasp.md)); solo diseño, no se implementa
- [ ] Demostrar el API Gateway real: Nginx con proxy `/api/`, `limit_req` y bloqueo de `/actuator` (evidencia de `OPS-05`)
- [ ] Preparar la respuesta de sustentación: "¿Por qué REST y no GraphQL/gRPC? ¿Qué es el API Gateway aquí?"

**Aceptación:** sección enlazada desde el manual técnico (`DOC-05`) y capturas del gateway en `DOC-16`.
