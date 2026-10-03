# Spec 08 — Entregables, UI/UX, Registro de IA y Release Final

## 1. Ficha

| Campo | Valor |
|:---|:---|
| **Épica** | ET — Técnica |
| **Historias técnicas** | TS-10 Registro de IA · TS-11 Diseño UX/UI · TS-12 Manuales, informes y sustentación |
| **Requerimientos** | OE-2, OE-9, OE-10 · RNF-05, RNF-10 |
| **Responsable** | Rol 1 (informes, manuales, release) · Roles 4 y 5 (UX/UI y manual de usuario) · Rol 6 (auditoría de IA e informe de pruebas) |
| **Prioridad** | **Must** |
| **Documentos fuente** | [UX/UI y prototipo](../../docs/01-definicion/ux-ui-prototipo.md) · [Registro de IA](../../docs/04-gestion/ia-register.md) · [Entregables y sustentación](../../docs/05-entregables/informes-y-sustentacion.md) · [Informe de Fase I](../../docs/05-entregables/informes-y-sustentacion.md#7-informe-de-la-fase-i--análisis-especificación-y-prototipo) · Plan: [`02-plan.md`](02-plan.md) · Tareas: [`03-tasks.md`](03-tasks.md) |
| **Fuera de alcance** | Identidad visual institucional oficial (se usan *tokens* reemplazables); traducción a otros idiomas |

**Contexto:** este módulo consolida lo exigido sobre el **proceso**: diseñar antes de construir, llevar una **bitácora estricta del uso de IA** (elemento diferenciador) y producir la documentación y la demostración final. Según el enunciado, **no se califica solo que la aplicación funcione**: debe verse el ciclo *Especificar → Diseñar → Construir → Integrar → Probar → Asegurar → Desplegar → Monitorear → Mejorar*.

---

## 2. Historias técnicas

### TS-10 — Registro de uso de IA
- **Como** equipo evaluado, **queremos** mantener un registro con herramienta, prompt, resultado, si se usó, validación, modificaciones y responsable, **para** demostrar que la IA fue una herramienta de ingeniería y no un sustituto del aprendizaje.

### TS-11 — Diseño UX/UI antes de construir
- **Como** equipo, **queremos** wireframes, mockups, un prototipo y un sistema de diseño validados, **para** construir el frontend sobre un diseño probado y usable.

### TS-12 — Manuales, informes y sustentación
- **Como** equipo, **necesitamos** manual de usuario, manual técnico, informe de pruebas, informes de fase y una demostración integral ensayada, **para** presentar y defender el producto.

---

## 3. Criterios de aceptación (BDD)

### Registro de IA

#### CA-1 — Entrada completa *(TS-10)*
```gherkin
Dado un integrante que usó IA de forma significativa (código, prueba, arquitectura, documentación, seguridad)
Cuando registra el uso en docs/04-gestion/ia-register.md
Entonces la entrada tiene los campos: herramienta, prompt, resultado generado, ¿se utilizó? (Sí/No/Parcialmente), validación realizada, modificaciones, responsable y fecha
  Y la validación indica qué prueba o comprobación CONCRETA se hizo (no solo "se revisó")
  Y el prompt no contiene secretos ni datos personales reales
```

#### CA-2 — Registro al día y auditado *(TS-10)*
```gherkin
Dado la revisión semanal del Registro de IA (Rol 6)
Cuando se compara con los PR de la semana que marcan "se usó IA"
Entonces cada PR con IA enlaza su(s) entrada(s) y no hay usos evidentes sin registrar
  Y las entradas incompletas se devuelven a su responsable antes de la siguiente reunión
```

#### CA-3 — Registros reales, no de ejemplo *(TS-10)*
```gherkin
Dado la sección de ejemplos de formato del registro
Entonces los ejemplos están claramente marcados como ilustrativos y NO se cuentan en las estadísticas ni en la evidencia presentada
```

#### CA-4 — Cobertura de áreas de uso *(TS-10)*
```gherkin
Dado el cierre del proyecto
Cuando se revisa el registro
Entonces hay evidencia de uso (y de su validación) en especificación, pruebas, seguridad, desarrollo asistido, DevOps y documentación
  Y las lecciones aprendidas del proyecto incluyen el aporte y los errores de la IA
```

#### CA-5 — Comprensión del código *(TS-10)*
```gherkin
Dado la sustentación
Cuando el docente pregunta a un integrante por un fragmento generado con IA
Entonces el integrante explica qué hace, por qué se eligió y cómo se validó
```

### Diseño UX/UI

#### CA-6 — Diseño antes de construir *(TS-11)*
```gherkin
Dado el calendario de la Fase I
Cuando comienza la construcción del frontend (TASK-005, TASK-008)
Entonces ya existen wireframes de las 4 pantallas clave, un sistema de diseño (tokens) y un prototipo clicable de los flujos de registro y asignación
```

#### CA-7 — Prototipo navegable *(TS-11)*
```gherkin
Dado el prototipo en Figma
Cuando una persona ajena al equipo completa la tarea "registrar una solicitud" navegando solo el prototipo
Entonces lo logra sin ayuda y se registran sus observaciones
```

#### CA-8 — Maqueta HTML/CSS/JS *(TS-11)*
```gherkin
Dado la maqueta de la Fase I con API simulada
Cuando se prueba en 375×667 y 1920×1080
Entonces los formularios validan en cliente, las listas se renderizan por manipulación del DOM con datos de fetch, y no hay scroll horizontal
```

#### CA-9 — Usabilidad y accesibilidad *(TS-11, RNF-05, RNF-10)*
```gherkin
Dado la versión desplegada en staging
Cuando se ejecutan las pruebas con ≥ 5 usuarios y la revisión manual de accesibilidad
Entonces el SUS medio es ≥ 70, la accesibilidad básica se cumple en las pantallas clave y los problemas mayores/bloqueantes están corregidos antes del Release Candidate
```

### Manuales, informes y sustentación

#### CA-10 — Manual de usuario *(TS-12)*
```gherkin
Dado la aplicación final desplegada
Cuando se redacta el manual de usuario
Entonces cubre los flujos de los 4 roles con capturas reales, estados, mensajes de error y su solución
```

#### CA-11 — Manual técnico *(TS-12)*
```gherkin
Dado el manual técnico
Cuando un desarrollador nuevo lo sigue en una máquina limpia
Entonces puede levantar el sistema con docker compose, ejecutar las pruebas y entender arquitectura, base de datos, API, seguridad y despliegue, con enlaces a las fuentes únicas
```

#### CA-12 — Informe de pruebas *(TS-12)*
```gherkin
Dado el fin de la Fase IV
Entonces existe el informe de pruebas con las secciones de las pruebas realizadas (unitarias, integración, API, aceptación, usuario, seguridad SAST/DAST, carga y estrés, observabilidad, IA, defectos y conclusiones)
```

#### CA-13 — Informes de hito *(TS-12)*
```gherkin
Dado los presentaciones de la semana 8 y la semana 12
Cuando se sube el informe al Classroom
Entonces cumple la plantilla de [Entregables §2 y §3] e incluye evidencias (capturas, enlaces, tags)
```

#### CA-14 — Revisión final del ciclo *(TS-12)*
```gherkin
Dado la revisión de TASK-023
Cuando se completa el checklist de release
Entonces cada una de las nueve etapas (Especificar … Mejorar) tiene enlazada su evidencia
  Y no quedan secretos ni hardcode, y la arquitectura, el código, los patrones, el manejo de errores, los escenarios y el uso de IA fueron revisados
```

#### CA-15 — Demostración integral *(TS-12)*
```gherkin
Dado la sustentación final
Cuando el equipo presenta
Entonces realiza una demostración EN VIVO sobre el sistema desplegado (flujo funcional, dashboard, administración, seguridad, DevOps, observabilidad y pruebas), no solo diapositivas
  Y sigue la secuencia del enunciado: Problema, Solución propuesta, Arquitectura, Historias de usuario, Demo Frontend, Demo Backend/API, Base de datos, Seguridad, Testing, CI/CD, Cloud, Observabilidad, Resultados y Lecciones aprendidas
  Y cada integrante interviene y puede responder sobre cualquier parte
```

---

## 4. Matriz de trazabilidad

| Criterio | Historia | Verificación |
|:---|:---:|:---|
| CA-1 … CA-5 | TS-10 | Auditoría semanal; revisión del registro; sustentación |
| CA-6, CA-7, CA-8 | TS-11 | Enlace Figma; maqueta; informe de Fase I |
| CA-9 | TS-11 | SUS; revisión de accesibilidad; informe de pruebas §5 |
| CA-10, CA-11 | TS-12 | Manuales entregados |
| CA-12, CA-13 | TS-12 | Informes en Classroom |
| CA-14 | TS-12 | Checklist de release firmado |
| CA-15 | TS-12 | Ensayo general (TASK-038) y sustentación |
