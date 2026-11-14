// Secciones del módulo de administración (UX §3 y W-09). Las rutas deben coincidir con router.jsx.
// Las usa la navegación lateral del shell (AppShell) como su grupo "Administración" (solo ADMIN).
export const SECCIONES_ADMIN = [
  { to: '/admin/usuarios', etiqueta: 'Usuarios', icono: 'users' },
  { to: '/admin/areas', etiqueta: 'Áreas', icono: 'building' },
  { to: '/admin/categorias', etiqueta: 'Categorías', icono: 'tag' },
  { to: '/admin/prioridades', etiqueta: 'Prioridades', icono: 'flag' },
  { to: '/admin/estados', etiqueta: 'Estados', icono: 'layers' },
];
