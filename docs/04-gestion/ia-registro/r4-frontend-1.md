# Registro de uso de IA — R4 · Frontend 1

> Bitácora **personal** de este rol. Las reglas, los campos, los criterios de aceptación y la auditoría están en el [Registro de IA](../ia-register.md); aquí solo se añaden filas. **Solo edita este archivo quien tiene este rol**, para que dos PR no choquen en el mismo `.md`.

**N°:** `R4-NN`, correlativo propio (01, 02, …). Prompt **sin secretos ni datos personales**; una entrada sin validación concreta no es válida.

| N° | Herramienta | Prompt utilizado | Resultado generado | ¿Se utilizó? | Validación realizada | Modificaciones realizadas | Responsable | Fecha |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| R4-01 | OpenCode (Muse Spark 1.3) | "Implementar AUTH-03: AuthContext/AuthProvider/useAuth con persistencia en localStorage, verificación de exp y pruebas (sesión válida, token vencido, storage roto, logout)" | `AuthContext.jsx` (contexto, expiración JWT, login/register/logout/updateUsuario), `AuthContext.test.jsx` (5 pruebas con MSW) y cableado en `providers.jsx` | Sí | `npx vitest run src/features/auth/AuthContext.test.jsx` (5/5), suite completa `npm test` (224 pasando + 1 todo preexistente), `npx eslint` limpio, `npx prettier --check` limpio, `npm run build` OK | 3: se corrigió doble lectura del cuerpo HTTP en `postAuth` (se consume una sola vez); se movió el disparo de login del render a un `useEffect` en el test (regla react-hooks/globals); se envolvió el efecto de restauración con disable justificado de `set-state-in-effect` | Rol 4 (Frontend 1) | 2026-10-15 |
