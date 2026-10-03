# Plan 01 — Diseño técnico de Autenticación

> **Qué contiene este plan:** las decisiones de diseño del módulo. **No repite** contratos ni esquema: la API está en [`docs/02-diseno/api-rest.md` §3.1](../../docs/02-diseno/api-rest.md#31-autenticación--auth), las tablas `usuarios` y `password_reset_tokens` en [`docs/02-diseno/modelo-datos.md`](../../docs/02-diseno/modelo-datos.md) y el DDL en `database/migrations/` ([ADR-010](../../docs/02-diseno/decisiones-arquitectura.md#adr-010--fuente-única-de-verdad-por-tema)).

## 1. Backend (paquetes `auth`, `usuario`, `common/security`)

### 1.1 Componentes

| Clase | Responsabilidad |
|:---|:---|
| `SecurityConfig` | `SecurityFilterChain` *stateless*; CSRF deshabilitado (autenticación por cabecera `Authorization`, [Seguridad §7](../../docs/03-calidad-y-operacion/seguridad-owasp.md#7-cabeceras-de-seguridad-tls-y-cors)); CORS desde `ALLOWED_ORIGINS`; `permitAll` solo para `/api/v1/auth/{login,registro}`, `/actuator/health` y (no `prod`) Swagger; el resto `authenticated()`; manejadores propios de 401/403 que devuelven RFC 7807. |
| `JwtService` | Genera y valida el token HS256. **Claims:** `sub` = id de usuario, `rol`, `idArea`, `iat`, `exp`, `jti`. Falla al arrancar si `JWT_SECRET` falta o tiene < 32 bytes. Rechaza `alg` distinto de HS256. |
| `JwtAuthenticationFilter` | Extrae `Bearer`, valida firma/expiración, **carga el usuario de BD** y comprueba `activo` (RN-22); establece `SecurityContext`. |
| `UsuarioDetails` | Adaptador de `Usuario` a `UserDetails` (autoridad `ROLE_*`). |
| `AuthService` | `login`, `registrar`, `cambiarPassword`. |
| `AuthController` | Endpoints; `@Valid`; devuelve DTO `record`. |
| `@PasswordSegura`, `@DominioInstitucional`, `@SinHtml` | Validadores reutilizables (RN-02, RN-03, RN-18). |
| `CurrentUser` | Fachada para obtener el usuario autenticado en servicios (evita leer el `SecurityContext` disperso). |
| `GlobalExceptionHandler` | Mapea `BadCredentialsException` → 401, validación → 400, conflicto → 409 (ver [Arquitectura §8](../../docs/02-diseno/arquitectura-tecnica.md#8-manejo-centralizado-de-errores)). |

### 1.2 Orden de filtros
`TraceIdFilter` → `RateLimitFilter` (si no se delega todo a Nginx) → `JwtAuthenticationFilter` → autorización → controlador.

### 1.3 Algoritmo de login (mensaje único ante cualquier fallo)

```
login(correo, password):
  correo = normalizar(correo)                       # minúsculas, trim
  usuario = repo.findByCorreo(correo)
  si usuario es null o !usuario.activo o !encoder.matches(password, usuario.passwordHash):
      log WARN seguridad (sin la contraseña); throw BadCredentials("Credenciales inválidas")
  usuario.ultimoAcceso = ahora; guardar
  return AuthResponse(jwtService.generar(usuario), usuario)
```
El mensaje es el mismo para correo inexistente, clave errónea o cuenta inactiva (prevención de enumeración). La protección contra fuerza bruta la da el *rate limit* por IP de Nginx.

### 1.4 Registro
`registrar(dto)`: normaliza correo → valida dominio y unicidad (correo y código) → hashea con BCrypt(12) → crea con `rol = ROLE_ESTUDIANTE`, `idArea = null`, `activo = true` → devuelve el mismo `AuthResponse` que login. El DTO **no declara** el campo `rol`; Jackson está configurado con `FAIL_ON_UNKNOWN_PROPERTIES = true` en este endpoint, por lo que cualquier campo extra produce 400 (CA-6).

### 1.5 Configuración (`application.yml`, solo `${VARIABLES}`)
`app.jwt.secret=${JWT_SECRET}` · `app.jwt.expiration-minutes=${JWT_EXPIRATION_MINUTES:480}` · `app.security.allowed-email-domain=${ALLOWED_EMAIL_DOMAIN:universidad.edu}` · `app.cors.allowed-origins=${ALLOWED_ORIGINS}`.

---

## 2. Frontend (feature `auth`)

### 2.1 Estado y sesión (`AuthContext`)
```javascript
// Forma del estado
{ token: string|null, usuario: {id,nombre,apellido,correo,rol,idArea}|null,
  isAuthenticated: boolean, isLoading: boolean }
// Acciones: login(correo, password), register(datos), logout(), updateUsuario()
```
- **Persistencia:** `localStorage["gestion_univ_auth"] = JSON.stringify({token, usuario})` envuelta en `try/catch` (si el almacenamiento falla, la sesión vive solo en memoria).
- **Carga inicial:** un `useEffect` restaura la sesión y **verifica la expiración leyendo `exp`** del token; si venció, limpia. `isLoading` evita el parpadeo de `/login`.
- Sin `dangerouslySetInnerHTML` en ninguna parte (mitigación del [ADR-004](../../docs/02-diseno/decisiones-arquitectura.md#adr-004--jwt-de-8-horas-sin-refresh-token)).

### 2.2 Cliente HTTP (`services/apiClient.js`)
- `baseURL = import.meta.env.VITE_API_URL` (`/api/v1`).
- **Interceptor de petición:** añade `Authorization: Bearer <token>` si hay sesión.
- **Interceptor de respuesta:** ante **401** (salvo en `/auth/login`) llama a `logout()`, guarda un aviso "Tu sesión expiró" y redirige a `/login`. Normaliza errores RFC 7807 a `{status, detail, errores, traceId}` para toda la app.

### 2.3 Rutas y componentes

| Elemento | Detalle |
|:---|:---|
| `pages/LoginPage.jsx` | Formulario con validación Zod; botón deshabilitado y *spinner*; error del backend en alerta (`role="alert"`). |
| `pages/RegisterPage.jsx` | 5 campos; **lista de requisitos de contraseña en vivo**; mensaje del dominio institucional. |
| `pages/RecuperarPasswordPage.jsx`, `RestablecerPasswordPage.jsx` | Mensaje neutro tras enviar ("Si el correo existe, recibirás instrucciones"). |
| `pages/PerfilPage.jsx` | Cambio de contraseña. |
| `components/layout/ProtectedRoute.jsx` | Si `!isAuthenticated` → `<Navigate to="/login" replace />`. |
| `components/layout/RoleRoute.jsx` | Si el rol no está en `allowedRoles` → página 403 amigable. |
| `schemas.js` | `LoginSchema`, `RegisterSchema`, `CambiarPasswordSchema` (Zod) con los mismos mensajes de [UX §9](../../docs/01-definicion/ux-ui-prototipo.md#9-microcopy-mensajes-de-la-interfaz). |
| Redirección tras login | `ESTUDIANTE → /mis-solicitudes` · `TECNICO`/`SUPERVISOR → /bandeja` · `ADMIN → /dashboard`. |

El cierre de sesión (US-04) vive en el menú de usuario y llama a `logout()` (borra la clave y navega a `/login`).

---

## 3. Seguridad y errores

| Riesgo | Control en este módulo |
|:---|:---|
| Enumeración de cuentas | Mensaje único "Credenciales inválidas" en todos los fallos de login |
| Fuerza bruta | *Rate limit* de Nginx por IP |
| Elevación de privilegios | Rol no aceptado en el DTO; `FAIL_ON_UNKNOWN_PROPERTIES` |
| Token robado/forjado | HS256 con secreto fuerte; rechazo de `alg:none`; expiración 8 h; usuario verificado en cada petición |
| Fuga de datos | DTO sin hash; logs sin contraseñas ni tokens |

## 4. Plan de pruebas
Ver matriz de trazabilidad en [`01-spec.md` §5](01-spec.md#5-matriz-de-trazabilidad) y casos TC-001, TC-002, TC-004…TC-006 y TC-027 en [Estrategia de pruebas §14](../../docs/03-calidad-y-operacion/estrategia-pruebas.md#14-catálogo-de-casos-de-prueba-prioritarios).
