# Tareas 01 — Autenticación

> Marcar con `[x]` solo cuando se cumpla la **Definición de Hecho** ([Gobernanza §4](../../docs/04-gestion/equipo-y-flujo-de-trabajo.md#4-definición-de-hecho-dod)). Roles: R1 Tech Lead · R2 Backend 1 · R3 Backend 2/DBA · R4 Frontend 1 · R5 Frontend 2 · R6 QA/DevOps. Tarea de planificación: **TASK-004** (BE), **TASK-005** (FE), **TASK-032** (credenciales avanzadas).

## Fase 1 — Entidades y repositorios (BE)

| ☐ | # | Tarea | US | Rol | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---:|:---|
| [ ] | 1.1 | Entidades `Usuario`, `Rol`, `Area` mapeadas al esquema `V1` (`ddl-auto=validate`) | US-02 | R1 | La app arranca contra MySQL con Flyway |
| [ ] | 1.2 | `UsuarioRepository` con `findByCorreo` y comprobación de unicidad de correo/código | US-02 | R1 | `UsuarioRepositoryIT` |
| [ ] | 1.3 | `UsuarioDetails` (adaptador a `UserDetails`) y `CurrentUser` | US-01 | R1 | Test unitario |

## Fase 2 — Seguridad (BE)

| ☐ | # | Tarea | US | Rol | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---:|:---|
| [ ] | 2.1 | `JwtService` (HS256, claims, `jti`, validación estricta, falla sin `JWT_SECRET` ≥ 32 bytes) | US-01 | R1 | `JwtServiceTest`: expirado, firma alterada, `alg:none` |
| [ ] | 2.2 | `JwtAuthenticationFilter` que carga el usuario y verifica `activo` (RN-22) | US-01 | R1 | CA-11, CA-12 |
| [ ] | 2.3 | `SecurityConfig`: *stateless*, CORS por entorno, `permitAll` mínimo, manejadores 401/403 en RFC 7807 | US-01 | R1 | `AutorizacionMatrizTest` (parte auth) |
| [ ] | 2.4 | `PasswordEncoder` BCrypt(12) como bean | US-01 | R1 | Test de hash ≠ texto plano |

## Fase 3 — Servicios, DTO y validaciones (BE)

| ☐ | # | Tarea | US | Rol | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---:|:---|
| [ ] | 3.1 | DTO `record`: `LoginRequest`, `RegistroRequest` (sin campo `rol`), `AuthResponse`, `CambiarPasswordRequest` | US-01/02 | R1 | Revisión contra [API §3.1](../../docs/02-diseno/api-rest.md#31-autenticación--auth) |
| [ ] | 3.2 | Validadores `@PasswordSegura`, `@DominioInstitucional`, `@SinHtml` | US-02 | R1 | Tablas de valores válidos/inválidos |
| [ ] | 3.3 | `AuthService.login` (algoritmo del plan §1.3) | US-01 | R1 | CA-2 |
| [ ] | 3.4 | `AuthService.registrar` (rol forzado, correo en minúsculas, auto-login) | US-02/03 | R1 | CA-4, CA-6, CA-7 |
| [ ] | 3.5 | `cambiarPassword` | US-18 | R1 | CA-14 |

## Fase 4 — Controlador y errores (BE)

| ☐ | # | Tarea | US | Rol | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---:|:---|
| [ ] | 4.1 | `AuthController` (6 endpoints) con `@Valid` y códigos HTTP del contrato | todos | R1 | `AuthControllerTest` |
| [ ] | 4.2 | `GlobalExceptionHandler` (RFC 7807 con `traceId`) para 400/401/403/409 | todos | R1 | Forma del error verificada |
| [ ] | 4.3 | `FAIL_ON_UNKNOWN_PROPERTIES` en `/auth/registro` | US-03 | R1 | CA-6 |

## Fase 5 — Frontend

| ☐ | # | Tarea | US | Rol | Evidencia / prueba |
|:-:|:-:|:---|:---:|:---:|:---|
| [ ] | 5.1 | Esquemas Zod (`LoginSchema`, `RegisterSchema`, `CambiarPasswordSchema`) | US-01/02/18 | R4 | `schemas.test` |
| [ ] | 5.2 | `apiClient` con interceptores de petición y de 401; normalización de errores RFC 7807 | US-01 | R4 | CA-11 |
| [ ] | 5.3 | `AuthContext` con persistencia en `localStorage` (`gestion_univ_auth`), verificación de `exp` y `try/catch` | US-01/04 | R4 | `AuthContext.test` |
| [ ] | 5.4 | `LoginPage` (deshabilitado/spinner/alerta) y redirección por rol | US-01 | R4 | UAT-01 |
| [ ] | 5.5 | `RegisterPage` con checklist de contraseña en vivo y mensaje de dominio | US-02 | R4 | CA-5, CA-8 |
| [ ] | 5.6 | `ProtectedRoute` y `RoleRoute` | RBAC | R4 | CA-9, CA-10 |
| [ ] | 5.7 | Cierre de sesión en el menú de usuario | US-04 | R4 | CA-13 |
| [ ] | 5.8 | `PerfilPage` (cambiar contraseña) | US-18 | R4 | CA-14 |

## Fase 6 — Calidad y verificación

| ☐ | # | Tarea | Rol | Evidencia |
|:-:|:-:|:---|:---:|:---|
| [ ] | 6.1 | Suite de autorización (matriz rol × endpoint) para los endpoints de auth y un recurso protegido de ejemplo | R6 | TC-005, TC-006, TC-027 |
| [ ] | 6.2 | Prueba de que la app **no arranca** sin `JWT_SECRET` o con secreto corto | R6 | `SecretoObligatorioTest` |
| [ ] | 6.3 | Colección Bruno `01-auth` y ejecución en CI | R6 | Reporte adjunto al PR |
| [ ] | 6.4 | Registrar en el [Registro de IA](../../docs/04-gestion/ia-register.md) todo uso de IA en este módulo | todos | Entradas con validación |
