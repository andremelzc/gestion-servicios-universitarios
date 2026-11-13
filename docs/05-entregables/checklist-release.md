# Checklist de release y revisión final (DOC-08)

> Basado en [Informes §4](informes-y-sustentacion.md#4-checklist-de-release-y-revisión-final). Estado al 13/11/2026. ✔ = verificado con la evidencia enlazada; ◐ = parcial; ✘ = pendiente.

| # | Ítem | Estado | Evidencia |
|:-:|:---|:-:|:---|
| 4.1 | Capas y patrones | ◐ | [Arquitectura §3 y §7](../02-diseno/arquitectura-tecnica.md); revisión estática en [revisión de calidad](../03-calidad-y-operacion/revision-calidad.md) |
| 4.2 | Sin código muerto ni depuración | ✔ | Revisión de calidad §1 (0 `System.out`/`console.log`) |
| 4.2 | Cobertura sobre umbrales | ✔ | Backend 81,2 % y frontend 68,4 % ([Informe de pruebas](../INFORME_PRUEBAS.md)) |
| 4.2 | Sin N+1 y con paginación | ◐ | Revisión estática; no medido con logs de Hibernate |
| 4.3 | Sin *hardcode* ni secretos | ✔ | Revisión de calidad §1; `gitleaks` en `.github/workflows/security.yml` |
| 4.3 | `.env` no versionado; `.env.example` completo | ✔ | `.gitignore`, `.env.example` |
| 4.4 | Errores RFC 7807 con `traceId` | ◐ | Verificado en producción; faltan 401/403 propios |
| 4.5 | Escenarios BDD y trazabilidad | ✔ | [Informe de pruebas](../INFORME_PRUEBAS.md), [E2E](../03-calidad-y-operacion/evidencia-e2e-mvp.md), [UAT-09/10](../03-calidad-y-operacion/evidencia-uat-09-10.md) |
| 4.6 | Registro de IA y lecciones | ✔ | [Registro de IA](../04-gestion/ia-register.md), [Lecciones aprendidas](lecciones-aprendidas.md) |
| 4.7 | Ciclo completo | ◐ | [Calendario §6](../04-gestion/calendario-y-contingencia.md#6-cumplimiento-del-ciclo-exigido) (8 de 9 etapas enlazadas) |
| 4.8 | Hardening | ◐ | [Estado del hardening](../03-calidad-y-operacion/evidencias/fase-3.md#estado-del-checklist-de-hardening-103) |
| 4.8 | Manual técnico | ✔ | [MANUAL_TECNICO.md](../MANUAL_TECNICO.md) |
| 4.8 | Tag `v1.0.0` y notas | ✘ | Se crea al cerrar el release |
