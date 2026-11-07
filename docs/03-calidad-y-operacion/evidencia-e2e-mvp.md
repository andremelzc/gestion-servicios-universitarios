# Validación E2E del Flujo MVP en Ambiente Integrado (TASK-013 · QA-00 · #81)

> **Objetivo:** Verificar de extremo a extremo el flujo principal del MVP (*Login → Registrar solicitud → Guardar en MySQL → Consultar → Asignar → Iniciar atención → Resolver → Cerrar*) operando con los **4 roles institucionales** (`ESTUDIANTE`, `SUPERVISOR`, `TECNICO`, `ADMIN`) contra MySQL 8.0 real y el stack integrado.
> **Prueba automatizada:** [`FlujoMvpE2EIT.java`](../../backend/src/test/java/edu/universidad/servicios/solicitud/FlujoMvpE2EIT.java) · **Colección de API:** [`api-tests/ciclo-de-solicitud/`](../../api-tests/ciclo-de-solicitud/)

---

## 1. Ambiente de Ejecución

| Componente | Configuración verificada |
|:---|:---|
| **Base de datos** | MySQL 8.0 (`mysql:8.0`) con migraciones Flyway `V1` a `V6` y validación de esquema (`ddl-auto=validate`) |
| **Backend** | Spring Boot (`:8080` API, `:8081` Actuator interno), `TraceIdFilter` activo (`X-Trace-Id` en 100 % de respuestas) |
| **Frontend / Gateway** | React 19 + Nginx (`:80`), proxy reverso `/api/v1/` → `backend:8080`, límite multipart `16m` |
| **Almacenamiento** | Volumen `/var/app/evidencias` para adjuntos JPG/PNG/PDF validados por firma mágica (*magic bytes*) |

---

## 2. Guion Ejecutado con los 4 Roles

| Paso | Rol | Operación HTTP / Acción en UI | Resultado Obtenido | Estado |
|:---:|:---|:---|:---|:---:|
| **1** | **4 Roles** (`ESTUDIANTE`, `SUPERVISOR`, `TECNICO`, `ADMIN`) | `POST /api/v1/auth/login` con credenciales de cada rol | `200 OK` + JWT HS256 (`Bearer`) + cabecera `X-Trace-Id` + perfil (`correo`, `rol`, `idArea`) | ✅ |
| **2** | **Estudiante** (`est.e2e@universidad.edu`) | `POST /api/v1/solicitudes` (`multipart/form-data`: JSON `solicitud` + imagen `proyector-falla.jpg`) | `201 Created` · Código correlativo `SOL-2026-0001` · Estado inicial `REGISTRADA` · `fechaLimiteSla` calculada según RN-09 | ✅ |
| **3** | **Verificación MySQL** | Consulta directa a `solicitudes`, `historial_solicitudes` y `evidencias_archivos` | Fila en `solicitudes` (`estado_codigo = 'REGISTRADA'`), 1 fila en `historial_solicitudes` (`NULL → REGISTRADA`), 1 fila en `evidencias_archivos` | ✅ |
| **4** | **Estudiante** | `GET /api/v1/solicitudes/mis-solicitudes` y `GET /api/v1/solicitudes/{id}` | `200 OK` · El ticket aparece en la bandeja del estudiante con su evidencia adjunta y `accionesPermitidas` coherentes | ✅ |
| **5** | **Supervisor TI** (`sup.ti.e2e@universidad.edu`) | `GET /api/v1/solicitudes` (bandeja de área) y `PUT /api/v1/solicitudes/{id}/asignar` al Técnico TI | `200 OK` · Estado avanza a `ASIGNADA` · Registra atómicamente **2 filas** en `historial_solicitudes`: `REGISTRADA → EN_EVALUACION` y `EN_EVALUACION → ASIGNADA` ([ADR-003](../02-diseno/decisiones-arquitectura.md#adr-003--atajo-de-asignación-desde-registrada)) | ✅ |
| **6** | **Técnico TI** (`tec.ti.e2e@universidad.edu`) | `PUT /api/v1/solicitudes/{id}/iniciar-atencion` | `200 OK` · Estado pasa a `EN_ATENCION` · `fechaInicioAtencion` registrada · Historial `ASIGNADA → EN_ATENCION` | ✅ |
| **7** | **Técnico TI** | `PUT /api/v1/solicitudes/{id}/resolver` (`multipart/form-data`: `datos` con `informe` + imagen `proyector-operativo.jpg`) | `200 OK` · Estado pasa a `RESUELTA` · `informeResolucion` persistido · Total de evidencias asociadas = 2 (RN-12) | ✅ |
| **8** | **Estudiante** | `PUT /api/v1/solicitudes/{id}/cerrar` con comentario de conformidad | `200 OK` · Estado final `CERRADA` · `fechaCierre` registrada · Historial `RESUELTA → CERRADA` | ✅ |
| **9** | **Administrador** (`admin.e2e@universidad.edu`) | `GET /api/v1/solicitudes/{id}/historial` y `GET /api/v1/dashboard/kpis` | `200 OK` · Línea de tiempo inmutable con los **6 eventos** cronológicos (`REGISTRADA`, `EN_EVALUACION`, `ASIGNADA`, `EN_ATENCION`, `RESUELTA`, `CERRADA`) y KPIs globales actualizados | ✅ |

---

## 3. Evidencia de Trazabilidad en Base de Datos (`historial_solicitudes`)

Al finalizar el recorrido E2E, la consulta sobre `GET /api/v1/solicitudes/{id}/historial` y la tabla `historial_solicitudes` en MySQL 8 reflejan la secuencia completa e inmutable (protegida por los triggers `trg_historial_no_update` y `trg_historial_no_delete`):

```json
[
  { "estadoAnterior": null,            "estadoNuevo": "REGISTRADA",    "nota": "Solicitud registrada" },
  { "estadoAnterior": "REGISTRADA",    "estadoNuevo": "EN_EVALUACION", "nota": "Evaluación automática al asignar desde REGISTRADA" },
  { "estadoAnterior": "EN_EVALUACION", "estadoNuevo": "ASIGNADA",      "nota": "Asignado a soporte técnico de laboratorio para revisión inmediata" },
  { "estadoAnterior": "ASIGNADA",      "estadoNuevo": "EN_ATENCION",   "nota": "Inicio de atención técnica" },
  { "estadoAnterior": "EN_ATENCION",   "estadoNuevo": "RESUELTA",      "nota": "Se reemplazó el cable HDMI deteriorado y se recalibró la lámpara del proyector." },
  { "estadoAnterior": "RESUELTA",      "estadoNuevo": "CERRADA",       "nota": "El proyector funciona correctamente en clase." }
]
```

---

## 4. Reproducción Automatizada

```bash
# 1. Suite de integración E2E contra MySQL 8 (Testcontainers)
cd backend && ./mvnw test -Dtest=FlujoMvpE2EIT

# 2. Colección de API de caja negra con Bruno CLI
npx @usebruno/cli run api-tests/ciclo-de-solicitud --env dev
```
