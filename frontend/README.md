# Frontend — Gestión de Servicios Universitarios

SPA con React 18 + JavaScript (JSX), Vite y React Router. Estructura por _features_ según
[Arquitectura técnica §4.2](../docs/02-diseno/arquitectura-tecnica.md#42-frontend-por-features).

## Requisitos

Node >= 20.19 y < 23 (el proyecto usa `engine-strict`) y npm.

## Scripts

| Comando                 | Qué hace                                                       |
| :---------------------- | :------------------------------------------------------------- |
| `npm run dev`           | Levanta la SPA en desarrollo (proxy `/api` → `localhost:8080`) |
| `npm run build`         | Genera el paquete de producción en `dist/`                     |
| `npm run preview`       | Sirve localmente el resultado de `build`                       |
| `npm run lint`          | ESLint (react, react-hooks)                                    |
| `npm run format`        | Prettier (escribe cambios); `format:check` solo verifica       |
| `npm test`              | Vitest en modo único (`vitest run`)                            |
| `npm run test:watch`    | Vitest en modo observador                                      |
| `npm run test:coverage` | Vitest con cobertura v8 (falla bajo 50 %)                      |

## Variables de entorno

| Variable       | Valor por defecto | Descripción                                                                            |
| :------------- | :---------------- | :------------------------------------------------------------------------------------- |
| `VITE_API_URL` | `/api/v1`         | URL base de la API. Se fija en _build_. Ver `.env.example` y `src/services/config.js`. |

Copia `.env.example` a `.env` para personalizarla. En desarrollo, Vite reenvía `/api` a
`http://localhost:8080` (`vite.config.js`); en producción lo hace Nginx.

## Estructura

```
src/
├── app/          App.jsx, router.jsx (mapa de rutas), providers.jsx, NotFoundPage.jsx
├── components/   ui/ (componentes reutilizables), layout/ (AppShell, rutas protegidas)
├── features/     auth · solicitudes · gestion · dashboard · admin  (pages/ en cada una)
├── services/     config.js (VITE_API_URL); apiClient y *.api.js por recurso
├── styles/       base.css (reglas base neutras); tokens.css pendiente
└── test/         setup.js (jest-dom, MSW) y server.js (servidor MSW)
```

Todas las rutas del [mapa de UX](../docs/01-definicion/ux-ui-prototipo.md) existen como
_placeholder_. La protección por sesión y rol (`ProtectedRoute`/`RoleRoute`) se agrega en un issue posterior.

## Pruebas

Vitest + Testing Library (jsdom) + MSW. `src/test/setup.js` levanta el servidor MSW con
`onUnhandledRequest: 'error'`: toda petición sin _handler_ falla la prueba. Los _handlers_
por recurso se agregan en `src/test/server.js` o con `server.use(...)` en cada prueba.
Los nombres de las pruebas citan el criterio: `[BASE-04 CA-n] ...`.
