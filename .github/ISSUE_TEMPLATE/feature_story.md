---
name: "Historia de Usuario / Feature"
about: "Especificación formal de requerimiento con criterios BDD y desglose técnico"
title: "[HU-XX]: <Título descriptivo de la funcionalidad>"
labels: ["enhancement", "user-story"]
assignees: ""
---

### 1. Descripción de la Historia de Usuario
- **Como:** [Rol del usuario: Estudiante / Técnico / Supervisor / Administrador]
- **Quiero:** [Acción o funcionalidad esperada en el sistema]
- **Para:** [Beneficio de negocio o necesidad técnica satisfecha]

---

### 2. Criterios de Aceptación (Formato BDD)

#### Escenario 1: Flujo Exitoso (Happy Path)
```gherkin
Dado que [condición inicial o estado del sistema/usuario autenticado]
Cuando [el usuario ejecuta la acción con datos válidos]
Entonces [el sistema responde con éxito y persiste los cambios]
Y [se muestra la confirmación visual o estado esperado]
```

#### Escenario 2: Flujo Alternativo o Validación de Errores
```gherkin
Dado que [condición inicial]
Cuando [el usuario ingresa datos inválidos o viola una regla de negocio]
Entonces [el sistema bloquea la operación con código HTTP apropiado o alerta UI]
Y [no se altera el estado ni la integridad de la base de datos]
```

---

### 3. Desglose Técnico de Tareas (Checklist)
- [ ] **Base de Datos / Migración:** Crear/actualizar tablas, constraints o índices.
- [ ] **Backend (Spring Boot):**
  - [ ] Entidad JPA / DTOs de Request y Response.
  - [ ] Métodos en Repository y Service con validaciones de negocio.
  - [ ] Endpoint REST en Controller con anotaciones de validación (`@Valid`) y seguridad `@PreAuthorize`.
  - [ ] Pruebas unitarias de Service con JUnit 5 + Mockito.
- [ ] **Frontend (React):**
  - [ ] Componente UI responsive siguiendo el sistema de diseño.
  - [ ] Integración con cliente API (`fetch`) y gestión de estados (loading/error).
  - [ ] Validaciones de formulario en cliente.
- [ ] **QA / Verificación:** Ejecución y evidencia de criterios BDD cumplidos.

---

### 4. Dependencias y Bloqueantes
- Depende de: # [ID de Issue previo]
- Bloquea a: # [ID de Issue subsecuente]
