# Spec 01 — Autenticación y Control de Accesos

## 1. Ficha

| Campo | Valor |
|:---|:---|
| **Épica** | E1 — Autenticación y control de accesos |
| **Historias (HU)** | HU-01 Inicio de sesión · HU-07 Registro y credenciales |
| **Historias divididas (US)** | US-01, US-02, US-03, US-04, US-18 |
| **Requerimientos** | RF-01, RF-02, RF-11 · RN-02, RN-03, RN-04, RN-22 · RNF-01 |
| **Roles afectados** | `ESTUDIANTE`, `TECNICO`, `SUPERVISOR`, `ADMIN` |
| **Prioridad** | **Must** (US-01…04, US-18) |
| **Dependencias** | Esquema `V1`/`V2` aplicado (TASK-002). Contrato en [API REST §3.1](../../docs/02-diseno/api-rest.md#31-autenticación--auth). Plan: [`02-plan.md`](02-plan.md) · Tareas: [`03-tasks.md`](03-tasks.md) |
| **Fuera de alcance** | Recuperación de contraseña por correo, bloqueo por intentos fallidos, SSO/LDAP, MFA, *refresh tokens*, inicio de sesión social ([ADR-004](../../docs/02-diseno/decisiones-arquitectura.md#adr-004--jwt-de-8-horas-sin-refresh-token)) |

**Objetivo:** implementar la barrera de seguridad del sistema: iniciar sesión, registrar estudiantes, emitir JWT y aplicar RBAC, con protección frente a enumeración de cuentas (el *rate limit* de login lo aplica Nginx).

---

## 2. Historias de usuario

| ID | Historia | Validaciones (frontend **y** backend) | Prio. |
|:---|:---|:---|:---:|
| **US-01** | Como usuario registrado, quiero **iniciar sesión** con mi correo y contraseña para acceder según mi rol. | Correo: formato email, obligatorio. Contraseña: obligatoria. El botón se deshabilita si hay errores y muestra *spinner* mientras envía. | M |
| **US-02** | Como estudiante nuevo, quiero **registrarme** con mis datos para poder crear solicitudes. | Código institucional `^[A-Za-z0-9]{6,20}$`. Nombre/apellido: 2–50 caracteres, sin HTML. Correo del dominio `ALLOWED_EMAIL_DOMAIN` y único. Contraseña: ≥ 8, 1 mayúscula, 1 número (RN-03). | M |
| **US-03** | Como sistema, quiero **asignar siempre el rol `ESTUDIANTE`** a los registros públicos. | El JSON de registro **no puede** incluir `rol` (si llega → 400). El rol se fuerza en el servidor (RN-04). | M |
| **US-04** | Como usuario autenticado, quiero **cerrar sesión** para proteger mi cuenta. | Se elimina la clave `gestion_univ_auth` de `localStorage` y se redirige a `/login`. | M |
| **US-18** | Como usuario autenticado, quiero **cambiar mi contraseña** para mantener segura mi cuenta. | Requiere contraseña actual; la nueva cumple RN-03 y es distinta de la actual. | M |

---

## 3. Reglas aplicables

- **RN-02** dominio institucional configurable; correo en minúsculas.
- **RN-03** política de contraseña. **RN-04** rol forzado.
- **RN-22** el backend verifica en cada petición que el usuario siga activo.
- BCrypt coste **12**; JWT HS256 de **8 h**; backend sin sesión (`STATELESS`).

---

## 4. Criterios de aceptación (BDD)

### CA-1 — Login exitoso *(US-01)*
```gherkin
Dado un usuario activo "juan@universidad.edu" con rol ESTUDIANTE y contraseña correcta
Cuando envía POST /api/v1/auth/login con su correo y contraseña
Entonces el servidor responde 200 OK
  Y el cuerpo contiene "token", "tipo": "Bearer", "expiraEn" y "usuario" con id, nombre, apellido, correo, rol e idArea
  Y la respuesta NO contiene el hash de la contraseña
  Y el frontend guarda token y perfil en localStorage bajo la clave "gestion_univ_auth"
  Y redirige a "/mis-solicitudes"
```
*Variante por rol:* TECNICO y SUPERVISOR → `/bandeja`; ADMIN → `/dashboard`.

### CA-2 — Credenciales inválidas, usuario inexistente o cuenta inactiva *(US-01)*
```gherkin
Dado un usuario que ingresa una contraseña errónea, o un correo que no existe, o una cuenta con activo = false
Cuando envía POST /api/v1/auth/login
Entonces el servidor responde 401 Unauthorized con application/problem+json
  Y el "detail" es exactamente "Credenciales inválidas" en los tres casos
  Y no se emite ningún token
  Y el frontend muestra una alerta roja con ese mensaje
```
*(No se distingue la causa: prevención de enumeración de cuentas.)*

### CA-3 — *(retirado)*
*Bloqueo por intentos fallidos retirado del alcance el 03/10/2026; el *rate limit* por IP de Nginx protege el login. La numeración CA se conserva.*

### CA-4 — Registro exitoso *(US-02, US-03)*
```gherkin
Dado un visitante en el formulario de registro
Cuando envía código "U20261045", nombre "Juan", apellido "Pérez", correo "juan@universidad.edu" y contraseña "Password123"
Entonces el servidor responde 201 Created con el mismo cuerpo que el login (inicio de sesión automático)
  Y el usuario se persiste con rol ROLE_ESTUDIANTE, activo = true y password_hash BCrypt (nunca texto plano)
  Y el correo se guarda en minúsculas
```

### CA-5 — Registro con dominio inválido *(US-02)*
```gherkin
Dado un estudiante completando el registro
Cuando ingresa el correo "juan@gmail.com"
Entonces el frontend bloquea el envío y muestra "Debe usar correo institucional (@universidad.edu)"
Y si se omite el frontend y se llama a la API directamente
Entonces el backend responde 400 con errores.correo y no crea el usuario
```

### CA-6 — Intento de elevar el rol en el registro *(US-03)*
```gherkin
Dado un atacante que llama a POST /api/v1/auth/registro
Cuando incluye en el JSON el campo "rol": "ADMIN"
Entonces el servidor responde 400 Bad Request
  Y no se crea ningún usuario
```

### CA-7 — Registro con correo o código duplicado *(US-02)*
```gherkin
Dado que existe un usuario con correo "juan@universidad.edu"
Cuando otro visitante intenta registrarse con el mismo correo (en cualquier combinación de mayúsculas)
Entonces el servidor responde 409 Conflict
  Y no se crea un segundo usuario
```

### CA-8 — Contraseña débil *(US-02, US-18)*
```gherkin
Dado un formulario de registro o de cambio de contraseña
Cuando la contraseña es "password" (sin mayúscula ni número) o tiene menos de 8 caracteres
Entonces se muestra el detalle de requisitos incumplidos en tiempo real
  Y el botón de enviar permanece deshabilitado
  Y el backend responde 400 con errores.password si se omite el frontend
```

### CA-9 — Acceso sin sesión *(RF-01)*
```gherkin
Dado un usuario sin sesión activa
Cuando navega a "/mis-solicitudes" o llama a GET /api/v1/solicitudes/mis-solicitudes sin token
Entonces el router redirige a "/login" o el backend responde 401
```

### CA-10 — Acceso con rol insuficiente (RBAC) *(RF-01)*
```gherkin
Dado un usuario autenticado con rol ESTUDIANTE
Cuando llama a PUT /api/v1/solicitudes/1/asignar o a cualquier endpoint de "/admin/**"
Entonces el servidor responde 403 Forbidden
  Y no modifica ningún dato
```

### CA-11 — Token expirado o manipulado *(RNF-01)*
```gherkin
Dado un token JWT expirado, con firma alterada o con algoritmo "none"
Cuando se envía en la cabecera Authorization
Entonces el servidor responde 401
  Y el frontend limpia la sesión, redirige a "/login" y muestra "Tu sesión expiró. Inicia sesión de nuevo."
```

### CA-12 — Usuario desactivado con token aún vigente *(RN-22)*
```gherkin
Dado un usuario con un JWT todavía vigente
Cuando un administrador lo desactiva (activo = false)
Entonces la siguiente petición con ese token responde 401
```

### CA-13 — Cerrar sesión *(US-04)*
```gherkin
Dado un usuario autenticado
Cuando pulsa "Cerrar sesión"
Entonces se elimina "gestion_univ_auth" de localStorage
  Y se redirige a "/login"
  Y al retroceder en el navegador no puede ver pantallas protegidas
```

### CA-14 — Cambio de contraseña *(US-18)*
```gherkin
Dado un usuario autenticado
Cuando envía PUT /api/v1/auth/cambiar-password con su contraseña actual correcta y una nueva válida
Entonces el servidor responde 204 No Content
  Y el siguiente login solo funciona con la nueva contraseña
```
```gherkin
Cuando envía una contraseña actual incorrecta
Entonces el servidor responde 400 con errores.passwordActual y la contraseña no cambia
```

### CA-15 y CA-16 — *(retirados)*
*Recuperación de contraseña por correo retirada del alcance el 03/10/2026 (el enunciado la deja "si el grupo tiene capacidad"). Se conserva el cambio de contraseña (CA-14).*

---

## 5. Matriz de trazabilidad

| Criterio | Historia | Pruebas esperadas (nombre) |
|:---|:---:|:---|
| CA-1, CA-2 | US-01 | `AuthServiceTest`, `AuthControllerTest`, `LoginPage.test` |
| CA-4, CA-6, CA-7 | US-02, US-03 | `RegistroControllerTest`, `RegistroRolForzadoTest` |
| CA-5, CA-8 | US-02, US-18 | `RegisterSchema.test`, validadores |
| CA-9, CA-10, CA-12 | RBAC | `AutorizacionMatrizTest` |
| CA-11 | RNF-01 | `JwtServiceTest` (expirado, firma, `alg:none`) |
| CA-13 | US-04 | `AuthContext.test`, `ProtectedRoute.test` |
| CA-14 | US-18 | `CambiarPasswordControllerTest` |
