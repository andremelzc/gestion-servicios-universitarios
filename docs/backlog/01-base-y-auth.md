# Backlog 01 — Base del proyecto y Autenticación

> Convenciones, roles e hitos: [README](README.md). Fuentes: [`specs/01-autenticacion`](../../specs/01-autenticacion/03-tasks.md), [`06-devops-seguridad` Fase 0](../../specs/06-devops-seguridad/03-tasks.md), [Calendario y contingencia](../04-gestion/calendario-y-contingencia.md). Contratos: [API §3.1](../02-diseno/api-rest.md#31-autenticación--auth).

---

# Épica BASE — Repositorio, datos y arranque

### BASE-01 · [Base] DevOps - Ramas protegidas `main` y `develop`
**Rol:** R1 · **Labels:** `devops` `TS-02` `TASK-001` · **Sprint:** S1 · **Milestone:** 1.1 Fundaciones técnicas · **Límite:** 06/10 · **Bloqueado por:** —
Crear `develop` y proteger `main`/`develop` según [Gobernanza §1.1](../04-gestion/equipo-y-flujo-de-trabajo.md#11-ramas-permanentes).
- [ ] Crear rama `develop`
- [ ] Proteger `main` y `develop` (PR obligatorio, 1 aprobación, checks requeridos, sin *force push*)
- [ ] Crear los 14 *milestones* de [`milestones.md`](milestones.md) (`1.1`…`2.8`) y etiquetas (`HU-xx`, `US-xx`, `TS-xx`, `backend`, `frontend`, `db`, `devops`, `seguridad`, `docs`, `bug`, `M/S/C`, `bloqueado`)
- [ ] Crear el tablero de GitHub Projects con las columnas definidas en [Backlog: gestión en GitHub Projects](README.md#gestión-en-github-projects)

**Aceptación:** captura de la configuración; el CI corre en un PR de prueba.

### BASE-02 · [Base] DevOps - `.gitignore`, `.env.example`, CODEOWNERS y Dependabot
**Rol:** R1 · **Labels:** `devops` `seguridad` `TS-04` `TASK-001` · **Sprint:** S1 · **Milestone:** 1.1 Fundaciones técnicas · **Límite:** 06/10 · **Bloqueado por:** —
- [ ] `.gitignore` (`.env`, `target/`, `node_modules/`, volúmenes de Docker)
- [ ] `.env.example` completo con todas las variables (`JWT_SECRET`, `ALLOWED_ORIGINS`, `ALLOWED_EMAIL_DOMAIN`, `LOGIN_MAX_ATTEMPTS`, …) y sin valores reales
- [ ] `CODEOWNERS`
- [ ] Plantillas de issue (bug, tarea técnica) junto a la de historia de usuario y revisión de la de PR
- [ ] `dependabot.yml` (Maven, npm, GitHub Actions, Docker)

**Aceptación:** `gitleaks` limpio; archivos presentes en `.github/`.

### BASE-03 · [Base] Backend - Proyecto Spring Boot, Flyway y conexión MySQL (TASK-002)
**Rol:** R3 · **Labels:** `backend` `db` `TASK-002` · **Sprint:** S1 · **Milestone:** 1.1 Fundaciones técnicas · **Límite:** 06/10 · **Bloqueado por:** BASE-01
Crear `backend/` con arquitectura por capas y aplicar `V1`/`V2` automáticamente.
- [ ] Proyecto Spring Boot 3 (Maven, Java 21) con paquetes `common`, `auth`, `usuario`, `solicitud`, …
- [ ] `application.yml` solo con `${VARIABLES}` y perfiles `dev`/`test`/`prod`
- [ ] Datasource MySQL + HikariCP
- [ ] Flyway apuntando a `database/migrations/` (V1 esquema, V2 datos maestros) y `ddl-auto=validate`
- [ ] MySQL en Docker (compose mínimo local) para desarrollo

**Aceptación:** el backend arranca contra MySQL y aplica las migraciones sin error.

### BASE-04 · [Base] Frontend - Proyecto Vite + React, rutas y estructura
**Rol:** R5 · **Labels:** `frontend` `TASK-005` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** — (no depende del backend)
- [ ] Proyecto Vite + React + React Router + ESLint/Prettier
- [ ] Estructura por *features* (`auth`, `solicitudes`, `dashboard`, `admin`) y `components/layout`, `services`, `styles`
- [ ] `VITE_API_URL` desde `.env` (`/api/v1`) y *proxy* de desarrollo
- [ ] Rutas vacías para todas las páginas con *placeholder*
- [ ] Capa **MSW** configurada (el resto de issues Frontend la usarán)

**Aceptación:** `npm run dev` levanta la SPA; `npm test` ejecuta una prueba de humo.

### BASE-05 · [Base] Backend - `DemoDataSeeder` (perfil `demo`) (TASK-025)
**Rol:** R3 · **Labels:** `backend` `db` `TASK-025` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** BASE-03, AUTH-06
- [ ] Usuarios demo de los 4 roles (contraseñas desde variable, nunca en el repo)
- [ ] Solicitudes de ejemplo en distintos estados
- [ ] Verificar los catálogos sembrados en `V2`
- [ ] Modo `carga` parametrizable (usado luego por `QA-14`)

**Aceptación:** entorno con usuarios y catálogos listos tras arrancar con `--spring.profiles.active=demo`.

---

# Épica AUTH — Módulo 1: Autenticación

## Backend (R1)

### AUTH-01 · [Auth] Backend - Entidades JPA, repositorio y `UsuarioDetails` (esqueleto de BD)
**Rol:** R1 · **Labels:** `backend` `auth` `db` `US-01` `US-02` `fase-1` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** BASE-03 · **Bloquea:** AUTH-02, AUTH-05…AUTH-11
Mapear `usuarios`, `roles`, `areas` del `V1` (tareas 1.1–1.3).
- [ ] Entidades `Usuario` (con `ultimoAcceso`, `activo`, `passwordHash`), `Rol`, `Area`
- [ ] `UsuarioRepository` con `findByCorreo` y comprobación de unicidad de correo/código
- [ ] `UsuarioDetails` (adaptador a `UserDetails`, autoridad `ROLE_*`) y `CurrentUser`

**Aceptación:** la app arranca con `ddl-auto=validate`; `UsuarioRepositoryIT` y test unitario de `UsuarioDetails` pasan.

### AUTH-02 · [Auth] Backend - `JwtService` (HS256)
**Rol:** R1 · **Labels:** `backend` `auth` `seguridad` `US-01` `fase-2` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** AUTH-01 · **Bloquea:** AUTH-07, AUTH-10
- [ ] Generar token con claims `sub`, `rol`, `idArea`, `iat`, `exp`, `jti`
- [ ] Expiración configurable (`JWT_EXPIRATION_MINUTES`, 480 por defecto)
- [ ] Validación estricta: firma, expiración y rechazo de `alg` ≠ HS256 (incluye `alg:none`)
- [ ] Falla al arrancar si falta `JWT_SECRET` o tiene < 32 bytes

**Aceptación:** `JwtServiceTest` cubre expirado, firma alterada y `alg:none`.

### AUTH-03 · [Auth] Frontend - `AuthContext` y persistencia de sesión
**Rol:** R4 · **Labels:** `frontend` `auth` `US-01` `US-04` `fase-5` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** BASE-04 · **Bloquea:** AUTH-16…AUTH-19
> **Mock:** `login`/`register` apuntan a una función mock con la respuesta de [API §3.1](../02-diseno/api-rest.md#31-autenticación--auth) (`{token, tipo, expiraEn, usuario}`). No esperar al backend.
- [ ] `AuthContext`/`AuthProvider`/`useAuth` con estado `{token, usuario, isAuthenticated, isLoading}`
- [ ] Acciones `login`, `register`, `logout`, `updateUsuario`
- [ ] Persistencia en `localStorage["gestion_univ_auth"]` con `try/catch`
- [ ] `useEffect` de carga inicial que verifica `exp` y limpia si venció; `isLoading` evita el parpadeo
- [ ] Sin `dangerouslySetInnerHTML`

**Aceptación:** `AuthContext.test` (sesión válida, token vencido, `localStorage` roto, `logout`).

### AUTH-04 · [Auth] Frontend - Esquemas Zod (Login, Register, CambiarPassword)
**Rol:** R4 · **Labels:** `frontend` `auth` `US-01` `US-02` `US-18` `fase-5` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** BASE-04 · **Bloquea:** AUTH-16, AUTH-17
- [ ] `LoginSchema`
- [ ] `RegisterSchema` (`codigoInstitucional` `^[A-Za-z0-9]{6,20}$`; nombre/apellido 2–50 sin HTML; dominio institucional; contraseña ≥ 8 + mayúscula + número; sin campo `rol`)
- [ ] `CambiarPasswordSchema`
- [ ] Mensajes de [UX §9](../01-definicion/ux-ui-prototipo.md#9-microcopy-mensajes-de-la-interfaz) y *helpers* para el checklist de contraseña en vivo

**Aceptación:** `schemas.test` con tablas de valores válidos/inválidos.

### AUTH-05 · [Auth] Backend - `AuthController` con DTO y endpoints esqueleto
**Rol:** R1 · **Labels:** `backend` `auth` `contrato` `US-01` `US-02` `fase-4` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** AUTH-01 (blando) · **Bloquea:** AUTH-10…AUTH-12
- [ ] DTO `record`: `LoginRequest`, `RegistroRequest` (sin `rol`), `AuthResponse`, `CambiarPasswordRequest`
- [ ] 4 endpoints con `@Valid` y códigos del contrato (login 200, registro 201, me 200, cambiar-password 204)
- [ ] Cuerpos como *stub* con `TODO` al issue del servicio

**Aceptación:** `AuthControllerTest` (rutas, códigos, 400 en payload inválido); DTO revisados contra API §3.1.

### AUTH-06 · [Auth] Backend - `PasswordEncoder` BCrypt(12) y validadores reutilizables
**Rol:** R2 · **Labels:** `backend` `auth` `seguridad` `US-01` `US-02` `fase-2` `fase-3` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** BASE-03 · **Bloquea:** AUTH-11, REG-02
- [ ] Bean `PasswordEncoder` BCrypt(12)
- [ ] `@PasswordSegura` (RN-03), `@DominioInstitucional` (RN-02), `@SinHtml` (RN-18)

**Aceptación:** test hash ≠ texto plano; tablas de valores válidos/inválidos por validador.

### AUTH-07 · [Auth] Backend - `JwtAuthenticationFilter`
**Rol:** R1 · **Labels:** `backend` `auth` `seguridad` `US-01` `fase-2` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** AUTH-02
- [ ] Extraer `Bearer`, validar firma y expiración
- [ ] Cargar el usuario de BD y verificar `activo` (RN-22)
- [ ] Establecer `SecurityContext`

**Aceptación:** CA-11 y CA-12 del spec 01 (usuario desactivado pierde acceso en la siguiente petición).

### AUTH-08 · [Auth] Backend - `SecurityConfig` (stateless, CORS, 401/403 RFC 7807)
**Rol:** R1 · **Labels:** `backend` `auth` `seguridad` `US-01` `fase-2` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** AUTH-07
- [ ] `SecurityFilterChain` *stateless*, CSRF deshabilitado (autenticación por cabecera)
- [ ] CORS por entorno (`ALLOWED_ORIGINS`)
- [ ] `permitAll` mínimo (`login`, `registro`, `/actuator/health`, Swagger fuera de `prod`)
- [ ] Manejadores 401/403 con cuerpo RFC 7807

**Aceptación:** `AutorizacionMatrizTest` (parte auth).

### AUTH-09 · [Auth] Backend - `GlobalExceptionHandler` (RFC 7807 con `traceId`)
**Rol:** R1 · **Labels:** `backend` `auth` `seguridad` `fase-4` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** AUTH-05
- [ ] Mapear `BadCredentialsException` → 401, validación → 400, conflicto → 409, acceso denegado → 403
- [ ] Incluir `traceId` en la respuesta ([API §1.2](../02-diseno/api-rest.md#12-estructura-de-error-rfc-7807))

**Aceptación:** forma del error verificada con pruebas de cada código.

### AUTH-10 · [Auth] Backend - `AuthService.login`
**Rol:** R1 · **Labels:** `backend` `auth` `seguridad` `US-01` `fase-3` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** AUTH-02, AUTH-05, AUTH-06
- [ ] Algoritmo del [plan §1.3](../../specs/01-autenticacion/02-plan.md#13-algoritmo-de-login-mensaje-único-ante-cualquier-fallo): normalizar correo, comparar con BCrypt y devolver el mensaje único "Credenciales inválidas"
- [ ] Registrar `ultimoAcceso` en un login correcto

**Aceptación:** CA-2 (mismo mensaje para correo inexistente, clave errónea y cuenta inactiva).

### AUTH-11 · [Auth] Backend - `AuthService.registrar` con rol forzado
**Rol:** R2 · **Labels:** `backend` `auth` `seguridad` `US-02` `US-03` `fase-3` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** AUTH-05, AUTH-06
- [ ] Normalizar correo (minúsculas), validar dominio y unicidad (correo y código)
- [ ] Crear con `rol = ROLE_ESTUDIANTE`, `idArea = null`, `activo = true`; auto-login (mismo `AuthResponse`)
- [ ] `FAIL_ON_UNKNOWN_PROPERTIES = true` en `/auth/registro` (campo `rol` → 400)

**Aceptación:** CA-4, CA-6, CA-7.

### AUTH-12 · [Auth] Backend - `cambiarPassword`
**Rol:** R2 · **Labels:** `backend` `auth` `US-18` `fase-3` `adelanto` · **Sprint:** S1 · **Milestone:** 1.6 Adelantos en paralelo (no bloquean el MVP) · **Límite:** 17/10 · **Plan B:** pasa a 2.3 · **Bloqueado por:** AUTH-10 · **Prioridad:** S
- [ ] Verificar `passwordActual` (400 con `errores.passwordActual` si falla)
- [ ] Validar política de la nueva contraseña y guardar hash

**Aceptación:** CA-14.

## Frontend (R4)

### AUTH-15 · [Auth] Frontend - `apiClient` con interceptores y errores RFC 7807
**Rol:** R4 · **Labels:** `frontend` `auth` `US-01` `fase-5` · **Sprint:** S1 · **Milestone:** 1.2 Auth backend y base frontend · **Límite:** 08/10 · **Bloqueado por:** BASE-04 (no por el backend)
> **Mock:** MSW con los errores de [API §1.2](../02-diseno/api-rest.md#12-estructura-de-error-rfc-7807).
- [ ] Cliente basado en `fetch` (envoltorio propio): `baseURL = VITE_API_URL` y cabecera `Authorization: Bearer`
- [ ] Manejo de respuesta: ante 401 (salvo `/auth/login`) → `logout()`, aviso "Tu sesión expiró" y redirección a `/login`
- [ ] Normalizar errores a `{status, detail, errores, traceId}`

**Aceptación:** CA-11 (pruebas con MSW).

### AUTH-16 · [Auth] Frontend - `LoginPage` y redirección por rol
**Rol:** R4 · **Labels:** `frontend` `auth` `US-01` `fase-5` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** AUTH-04 (Zod), AUTH-03 (Context), AUTH-15 · **Mock:** `POST /auth/login`
- [ ] Formulario con Zod; botón deshabilitado y *spinner* durante el envío
- [ ] Error del backend en alerta (`role="alert"`)
- [ ] Redirección: ESTUDIANTE → `/mis-solicitudes` · TECNICO/SUPERVISOR → `/bandeja` · ADMIN → `/dashboard`
- [ ] Sustituir el mock por `apiClient` cuando `AUTH-10` esté en `develop`

**Aceptación:** UAT-01.

### AUTH-17 · [Auth] Frontend - `RegisterPage` con checklist de contraseña en vivo
**Rol:** R4 · **Labels:** `frontend` `auth` `US-02` `fase-5` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** AUTH-04, AUTH-03 · **Mock:** `POST /auth/registro`
- [ ] 5 campos con validación Zod
- [ ] Lista de requisitos de contraseña en vivo
- [ ] Mensaje de dominio institucional y manejo del 409
- [ ] Sustituir el mock cuando `AUTH-11` esté en `develop`

**Aceptación:** CA-5, CA-8.

### AUTH-18 · [Auth] Frontend - `ProtectedRoute` y `RoleRoute`
**Rol:** R5 · **Labels:** `frontend` `auth` `RBAC` `fase-5` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** AUTH-03
- [ ] `ProtectedRoute`: `!isAuthenticated` → `<Navigate to="/login" replace />`
- [ ] `RoleRoute`: rol fuera de `allowedRoles` → página 403 amigable
- [ ] Respetar `isLoading` para no parpadear

**Aceptación:** CA-9, CA-10.

### AUTH-19 · [Auth] Frontend - Cierre de sesión en el menú de usuario
**Rol:** R4 · **Labels:** `frontend` `auth` `US-04` `fase-5` · **Sprint:** S1 · **Milestone:** 1.3 Registro backend, UI de auth y maqueta · **Límite:** 11/10 · **Bloqueado por:** AUTH-03
- [ ] Menú de usuario en el *layout* con nombre y rol
- [ ] "Cerrar sesión" llama `logout()` (borra la clave y navega a `/login`)

**Aceptación:** CA-13.

## Calidad (R6)

### AUTH-21 · [Auth] QA - Suite de autorización de auth (matriz rol × endpoint)
**Rol:** R6 · **Labels:** `qa` `auth` `seguridad` · **Sprint:** S1 · **Milestone:** 1.5 Pruebas, E2E, informe y presentación de la Fase 1 · **Límite:** 16/10 · **Bloqueado por:** AUTH-08, AUTH-11
- [ ] Matriz rol × endpoint de auth y de un recurso protegido de ejemplo
- [ ] Casos de token ausente, vencido y de usuario desactivado

**Aceptación:** TC-005, TC-006, TC-027.

### AUTH-22 · [Auth] QA - La app no arranca sin `JWT_SECRET` (o con secreto corto)
**Rol:** R6 · **Labels:** `qa` `auth` `seguridad` · **Sprint:** S1 · **Milestone:** 1.5 Pruebas, E2E, informe y presentación de la Fase 1 · **Límite:** 16/10 · **Bloqueado por:** AUTH-02
- [ ] `SecretoObligatorioTest`: sin variable, vacío y < 32 bytes

**Aceptación:** el contexto de Spring falla con mensaje claro en los 3 casos.
