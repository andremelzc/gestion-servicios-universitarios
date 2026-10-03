# Spec 06 — DevOps, API Documentada y Seguridad (Fase III)

## 1. Ficha

| Campo | Valor |
|:---|:---|
| **Épica** | ET — Técnica: DevOps, seguridad y calidad |
| **Historias técnicas** | TS-01 Contenerización · TS-02 CI · TS-03 CD · TS-04 Seguridad y secretos · TS-08 SAST/DAST · TS-09 Documentación de API |
| **Requerimientos** | RNF-01, RNF-03, RNF-07, RNF-09, RNF-11 · RN-15, RN-18 |
| **Responsable** | Rol 6 (lidera) · Rol 1 (cloud/CD y hardening) · Roles 2 y 3 (OpenAPI) |
| **Prioridad** | **Must** |
| **Documentos fuente** | [DevOps y despliegue](../../docs/03-calidad-y-operacion/devops-despliegue.md) · [Seguridad y OWASP](../../docs/03-calidad-y-operacion/seguridad-owasp.md) · [API REST](../../docs/02-diseno/api-rest.md) · [ADR-006/007/008](../../docs/02-diseno/decisiones-arquitectura.md) · Plan: [`02-plan.md`](02-plan.md) · Tareas: [`03-tasks.md`](03-tasks.md) |
| **Fuera de alcance** | Kubernetes, *service mesh*, WAF comercial, escaneo antimalware de archivos (riesgo aceptado, [Seguridad §4](../../docs/03-calidad-y-operacion/seguridad-owasp.md#4-seguridad-en-la-subida-de-archivos-evidencias)) |

**Contexto:** una vez que el desarrollo full-stack funciona, el código debe **empaquetarse, probarse y desplegarse de forma automatizada y segura**, y la aplicación debe cumplir estándares de seguridad que protejan la información de la universidad.

---

## 2. Historias técnicas

### TS-01 — Contenerización
- **Como** administrador de infraestructura, **quiero** frontend, backend y base de datos empaquetados en contenedores, **para** que el sistema funcione idénticamente en desarrollo, pruebas y producción.

### TS-02 — Integración continua
- **Como** líder técnico, **quiero** que cada PR ejecute compilación, pruebas, cobertura y análisis de seguridad, **para** que no llegue código roto o inseguro a `develop`/`main`.

### TS-03 — Despliegue continuo
- **Como** equipo, **queremos** desplegar automáticamente a *staging* y, al crear un tag de versión, a *producción*, **para** entregar con rapidez, trazabilidad y posibilidad de *rollback*.

### TS-04 — Seguridad y OWASP
- **Como** oficial de seguridad de la universidad, **quiero** que la aplicación valide todas las entradas, no tenga contraseñas en el código y proteja los secretos, **para** evitar vulnerabilidades comunes (inyecciones, exposición de datos, acceso indebido).

### TS-08 — SAST y DAST
- **Como** equipo, **queremos** análisis estático y dinámico automatizados, **para** detectar vulnerabilidades antes del release.

### TS-09 — API documentada
- **Como** desarrollador o evaluador, **quiero** una API documentada y consultable (OpenAPI/Swagger), **para** entender y probar cada endpoint sin leer el código.

---

## 3. Criterios de aceptación (BDD)

### Contenerización y ambientes

#### CA-1 — Ejecución local unificada *(TS-01, RNF-09)*
```gherkin
Dado que un nuevo desarrollador clona el proyecto en una máquina limpia con Docker
  Y copia .env.example a .env y completa los valores
Cuando ejecuta "docker compose up --build"
Entonces la base de datos, el backend y el frontend se levantan y se conectan entre sí sin instalar manualmente Java, Node ni MySQL
  Y las migraciones Flyway se aplican solas
  Y la aplicación responde en http://localhost y el login funciona con un usuario de demostración
```

#### CA-2 — Arranque ordenado y salud *(TS-01, RNF-07)*
```gherkin
Dado que la base de datos aún no está lista
Cuando se inicia el stack
Entonces el backend espera a que la BD esté "healthy" y el frontend a que el backend lo esté
  Y si un contenedor se detiene por un fallo, Docker lo reinicia automáticamente (restart: unless-stopped)
```

#### CA-3 — Imágenes seguras *(TS-04)*
```gherkin
Dado las imágenes del backend y del frontend
Cuando se inspeccionan
Entonces el backend se ejecuta con un usuario que NO es root
  Y las imágenes base tienen versión fija (no "latest")
  Y el puerto 3306 de MySQL NO está publicado al exterior en el ambiente prod
  Y no contienen .env, .git ni código fuente innecesario
```

#### CA-4 — Ambientes separados *(TS-03)*
```gherkin
Dado los ambientes dev, test (staging) y prod
Entonces cada uno usa su propio .env/GitHub Environment con secretos DISTINTOS entre sí
  Y prod tiene Swagger desactivado, errores sin detalle y TLS activo
```

### Seguridad

#### CA-5 — Protección de secretos *(TS-04)*
```gherkin
Dado el código fuente y el historial del repositorio
Cuando se audita (gitleaks + búsqueda de "password", "secret", "jdbc:")
Entonces no existe ninguna contraseña de base de datos ni llave JWT hardcodeada
  Y todos los secretos se cargan desde variables de entorno / GitHub Secrets
  Y .env está en .gitignore y solo existe .env.example con valores no reales
```
```gherkin
Cuando el backend se inicia sin JWT_SECRET, o con uno menor a 32 bytes
Entonces la aplicación falla al arrancar con un mensaje claro (no usa un valor por defecto)
```
```gherkin
Cuando se hace commit de un archivo con una clave de API de prueba
Entonces el hook pre-commit o el job de CI "gitleaks" falla y bloquea el merge
```

#### CA-6 — Prevención de inyecciones y XSS *(TS-04, RN-18)*
```gherkin
Dado un formulario de entrada (ej. registro de solicitud)
Cuando el usuario ingresa "<script>alert(1)</script>" o "<img src=x onerror=alert(1)>"
Entonces el backend responde 400 Bad Request con el campo observado y NO persiste el dato
  Y el frontend nunca renderiza HTML del usuario (sin dangerouslySetInnerHTML)
```
```gherkin
Cuando se envía "' OR 1=1 --" en un campo de texto o en un parámetro de búsqueda
Entonces el sistema lo trata como texto literal (consultas parametrizadas) y no altera la consulta
  Y un parámetro "sort" con un valor fuera de la lista blanca responde 400
```

#### CA-7 — CORS estricto *(TS-04)*
```gherkin
Dado que ALLOWED_ORIGINS contiene solo el dominio oficial del frontend
Cuando un sitio con otro origen hace una petición con credenciales a la API
Entonces el navegador la bloquea porque la respuesta no incluye Access-Control-Allow-Origin para ese origen
```

#### CA-8 — Cabeceras de seguridad *(TS-04)*
```gherkin
Dado el ambiente desplegado
Cuando se hace "curl -I" a la aplicación
Entonces la respuesta incluye Strict-Transport-Security, Content-Security-Policy (sin unsafe-inline/unsafe-eval), X-Content-Type-Options: nosniff, X-Frame-Options: DENY y Referrer-Policy
  Y no revela la versión del servidor
```

#### CA-9 — Límite de intentos *(TS-04)*
```gherkin
Dado un cliente que envía más de 10 peticiones por minuto a /api/v1/auth/login
Cuando supera el límite
Entonces recibe 429 Too Many Requests
```

#### CA-10 — Superficie administrativa no expuesta *(TS-04, TS-09)*
```gherkin
Dado el ambiente prod
Cuando se accede desde Internet a /swagger-ui.html, /v3/api-docs o /actuator/prometheus
Entonces la respuesta es 404 (o no enrutada)
  Y solo /actuator/health es accesible
```
```gherkin
Dado los ambientes dev y test
Entonces /swagger-ui.html y /v3/api-docs están disponibles
```

### CI/CD

#### CA-11 — Integración continua en cada PR *(TS-02)*
```gherkin
Dado un Pull Request hacia develop o main
Cuando se abre o se actualiza
Entonces se ejecutan los jobs backend (mvn verify con Testcontainers), frontend (lint, test, build), docker-build y security
  Y si cualquiera falla, el PR no se puede fusionar (rama protegida)
```
```gherkin
Dado que no existen los directorios backend/ o frontend/
Entonces el job falla (no termina en verde sin ejecutar nada)
```

#### CA-12 — Cobertura mínima *(TS-02)*
```gherkin
Cuando corren las pruebas del backend en CI
Entonces se genera el reporte JaCoCo
  Y el build falla si la cobertura de líneas global es menor a 70 %
```

#### CA-13 — Despliegue a staging *(TS-03)*
```gherkin
Dado que un PR se fusiona en develop con CI verde
Cuando termina el workflow cd-staging
Entonces se publican imágenes etiquetadas con el SHA en GHCR
  Y el servidor de staging queda actualizado sin pasos manuales
  Y un smoke test (GET /actuator/health = UP y login de prueba) pasa
  Y se ejecuta el escaneo ZAP baseline
```

#### CA-14 — Despliegue a producción por tag *(TS-03)*
```gherkin
Dado un tag SemVer "v1.0.0" creado desde main
Cuando se dispara cd-prod
Entonces se despliegan las imágenes de ese tag
  Y ejecuta el smoke test al terminar
```

#### CA-15 — Rollback *(TS-03)* — recortado
*La prueba medida de rollback salió del alcance el 03/10/2026. El procedimiento (redesplegar el tag anterior, migraciones aditivas) sigue documentado en [DevOps](../../docs/03-calidad-y-operacion/devops-despliegue.md). El número CA-15 se conserva para no renumerar los demás criterios.*

### SAST / DAST / dependencias

#### CA-16 — Análisis estático *(TS-08)*
```gherkin
Dado un PR que introduce una vulnerabilidad detectable (ej. consulta SQL concatenada)
Cuando corre CodeQL
Entonces el job reporta el hallazgo y bloquea el merge si es de severidad alta o crítica
```

#### CA-17 — Dependencias vulnerables *(TS-08)*
```gherkin
Dado una dependencia con una vulnerabilidad conocida de severidad alta
Cuando Dependabot analiza el repositorio
Entonces abre una alerta y un PR con la versión corregida
```

#### CA-18 — Análisis dinámico *(TS-08)*
```gherkin
Dado el ambiente de staging desplegado
Cuando se ejecuta OWASP ZAP (baseline en cada despliegue)
Entonces no quedan alertas de riesgo Alto sin resolver
  Y los hallazgos Medios están triados con decisión documentada
```

### API documentada

#### CA-19 — OpenAPI completa *(TS-09, RNF-11)*
```gherkin
Dado la API desplegada en dev o staging
Cuando se abre /swagger-ui.html
Entonces el 100 % de los endpoints aparecen con resumen, roles requeridos, códigos de respuesta y ejemplos
  Y el botón "Authorize" permite probar con un JWT
  Y el archivo openapi.yaml se exporta versionado en cada release
```

---

## 4. Matriz de trazabilidad

| Criterio | Historia | Verificación |
|:---|:---:|:---|
| CA-1, CA-2, CA-3 | TS-01 | TC-033; revisión de Dockerfiles; `docker inspect` |
| CA-4, CA-13, CA-14 | TS-03 | Pipeline y registro de despliegues |
| CA-5 | TS-04 | gitleaks sobre el historial; `SecretoObligatorioTest` |
| CA-6 | TS-04 | TC-011; pruebas con *payloads* |
| CA-7, CA-8, CA-9, CA-10 | TS-04 | `curl`, ZAP, pruebas de configuración |
| CA-11, CA-12 | TS-02 | Workflow `ci.yml`; JaCoCo |
| CA-16, CA-17, CA-18 | TS-08 | `security.yml`; informe ZAP |
| CA-19 | TS-09 | Swagger completo y `openapi.yaml` exportado |
