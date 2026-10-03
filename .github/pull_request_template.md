## 📌 Descripción del Cambio
Resumen conciso y claro de qué resuelve este Pull Request y por qué es necesario.

- **Historia de Usuario / Issue asociado:** Closes #`[Número de Issue]`
- **Módulo Afectado:** `[Autenticación / Registro / Gestión / Dashboard / Administración / Infra-CI-CD]`
- **Tipo de Cambio:**
  - [ ] `feat`: Nueva funcionalidad
  - [ ] `fix`: Corrección de error (bug fix)
  - [ ] `refactor`: Refactorización de código sin cambio de comportamiento
  - [ ] `test`: Adición o mejora de pruebas unitarias/integración
  - [ ] `docs`: Modificación o adición de documentación técnica
  - [ ] `chore`: Mantenimiento de configuración, dependencias o pipeline CI

---

## 🛠️ Desglose de Cambios Técnicos
- **Backend (Spring Boot / MySQL):**
  - Describir cambios en entidades, controladores, servicios o migraciones SQL.
- **Frontend (React):**
  - Describir componentes nuevos, rutas o hooks implementados.

---

## 🧪 Pruebas y Evidencias de Validación
- [ ] Pruebas unitarias ejecutadas localmente y pasando al 100%.
- [ ] Cobertura de escenarios BDD asociados al issue.
- [ ] No se introducen warnings ni errores de linter/compilación.

### Capturas de Pantalla / Logs de Ejecución (Obligatorio para UI o endpoints clave)
*(Inserta aquí capturas del frontend o respuesta JSON de Postman/Swagger)*

---

## 🤖 Registro de Uso de IA
- ¿Se utilizó IA (Copilot, ChatGPT, Claude, etc.) para este cambio?: `[SÍ / NO]`
- En caso afirmativo, ¿se registró la entrada correspondiente en `docs/04-gestion/ia-register.md`?: `[SÍ / N/A]`

---

## ✅ Checklist de Control de Calidad
- [ ] La rama origen sigue la convención (`feature/HU-XX-...`, `fix/...`).
- [ ] Los commits siguen el estándar **Conventional Commits**.
- [ ] No se comitearon credenciales, contraseñas ni variables de entorno sensibles (`.env`).
- [ ] La rama destino es `develop` (o rama base correspondiente, nunca merge directo a `main`).
- [ ] Revisión solicitada al menos a 1 integrante del equipo.
