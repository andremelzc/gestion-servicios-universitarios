# Plan 08 — Plan de Entregables, UX/UI y Registro de IA

> Detalle en los documentos fuente: [UX/UI y prototipo](../../docs/01-definicion/ux-ui-prototipo.md) · [Registro de IA](../../docs/04-gestion/ia-register.md) · [Entregables y sustentación](../../docs/05-entregables/informes-y-sustentacion.md). Este plan fija **qué se produce, dónde se guarda y cuándo**.

## 1. Registro de IA

| Aspecto | Decisión |
|:---|:---|
| **Ubicación única** | `docs/04-gestion/ia-register.md` (reglas) y un archivo por rol en `docs/04-gestion/ia-registro/` (bitácora); se unifica el nombre, antes aparecía también `REGISTRO_IA.md`. El registro del grupo es la unión de ambos |
| **Formato** | Tabla Markdown con los campos exigidos + N° y fecha; ejemplos aparte, marcados como ilustrativos |
| **Cuándo se registra** | Inmediatamente al usar la IA; en el PR se enlaza el N° |
| **Auditoría** | Semanal (Rol 6, 15 min en la *review*) |
| **Plantilla de PR** | Pregunta "¿Se usó IA?" y exige el N° de la entrada |
| **Lecciones aprendidas** | Sección del informe final (incluye el aporte y los errores de la IA) ([§10 del registro](../../docs/04-gestion/ia-register.md#10-reflexión-final-se-completa-en-la-fase-iv)) |

## 2. Plan de UX/UI

| Paso | Entregable | Dónde | Cuándo |
|:-:|:---|:---|:---:|
| 1 | Usuarios, flujos y arquitectura de información | [UX §1, §3, §4](../../docs/01-definicion/ux-ui-prototipo.md) | ✅ |
| 2 | **Wireframes** de baja fidelidad (10 pantallas) | [UX §5](../../docs/01-definicion/ux-ui-prototipo.md#5-wireframes-de-baja-fidelidad) | ✅ |
| 3 | Sistema de diseño: *tokens*, tipografía, componentes | [UX §2](../../docs/01-definicion/ux-ui-prototipo.md#2-sistema-de-diseño) → `tokens.css` | 09/10 |
| 4 | **Mockups** de alta fidelidad (móvil y escritorio) y **prototipo clicable** | Figma (TASK-003) | 09/10 |
| 5 | **Maqueta HTML/CSS/JS** con API simulada (`fetch`, validaciones, DOM) | `frontend-prototipo/` (TASK-033) | 11/10 |
| 6 | Revisión heurística y prueba con 2 personas ajenas | Notas en el informe de Fase I | 11/10 |
| 7 | Pruebas de usabilidad con ≥ 5 usuarios (SUS) | Informe de pruebas (TASK-031) | 02/12 |

## 3. Estructura de la documentación final

```
docs/
├── README.md                          (índice general)
├── 01-definicion/                     documento-proyecto · especificaciones-tecnicas · ux-ui-prototipo
├── 02-diseno/                         arquitectura-tecnica · modelo-datos · api-rest · decisiones-arquitectura
├── 03-calidad-y-operacion/            seguridad-owasp · devops-despliegue · observabilidad · estrategia-pruebas
├── 04-gestion/                        calendario-y-contingencia · equipo-y-flujo-de-trabajo · ia-register · ia-registro/ (un archivo por rol)
├── 05-entregables/                    informes-y-sustentacion (incluye el índice del informe de la Fase I)
├── backlog/                           issues, milestones y cobertura del enunciado
├── incidentes/                  (post-mortems y simulacros)
├── MANUAL_USUARIO.pdf           (TASK-022)
├── MANUAL_TECNICO.md            (TASK-022; enlaza las fuentes)
└── INFORME_PRUEBAS.md / .pdf    (TASK-037)
```

## 4. Plan de manuales e informes

| Entregable | Esquema | Responsable | Fecha |
|:---|:---|:---:|:---:|
| Informe de Fase I (parte de la Fase 1) | [Índice](../../docs/05-entregables/informes-y-sustentacion.md#7-informe-de-la-fase-i--análisis-especificación-y-prototipo) | R1 | 16/10 |
| Informe de la Fase 1 (I + II) | [Plantilla §2](../../docs/05-entregables/informes-y-sustentacion.md#2-plantilla-del-informe-de-la-fase-1) | R1 | 16/10 |
| Informe de pruebas | [Estrategia §13](../../docs/03-calidad-y-operacion/estrategia-pruebas.md#13-informe-de-pruebas-entregable) | R6 | 10/11 |
| Manual de usuario | [Entregables §3.2](../../docs/05-entregables/informes-y-sustentacion.md#32-manual-de-usuario-docsmanual_usuariopdf) | R1 + R4 | 12/11 |
| Manual técnico | [Entregables §3.3](../../docs/05-entregables/informes-y-sustentacion.md#33-manual-técnico-docsmanual_tecnicomd) | R1 + R4 | 12/11 |
| Informe final | [Entregables §3.1](../../docs/05-entregables/informes-y-sustentacion.md#31-informe-final) | Equipo | 14/11 |

## 5. Preparación de la sustentación
Guion, tiempos, reglas y checklist del ambiente en [Entregables §5](../../docs/05-entregables/informes-y-sustentacion.md#5-guion-de-la-sustentación-demostración-integral); ensayo general en TASK-038.

## 6. Riesgos

| Riesgo | Mitigación |
|:---|:---|
| El registro de IA se llena al final y sin validación real | Auditoría semanal; la validación concreta es campo obligatorio |
| Mockups tardíos bloquean el frontend | Wireframes ya listos; el frontend avanza con *tokens* y componentes base |
| Manuales redactados al final con capturas desactualizadas | Capturas con el *tag* `v1.0.0` en el ambiente de demo |
| Demo falla en vivo | Ambiente ensayado y seed reproducible |
