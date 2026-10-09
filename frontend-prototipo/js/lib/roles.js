// Redirección y menú por rol (ux-ui-prototipo.md §3 y §4.1).

const ITEMS = [
  { etiqueta: 'Mis solicitudes', href: 'mis-solicitudes.html', roles: ['ESTUDIANTE', 'TECNICO', 'SUPERVISOR', 'ADMIN'] },
  { etiqueta: 'Nueva solicitud', href: 'nueva-solicitud.html', roles: ['ESTUDIANTE', 'TECNICO', 'SUPERVISOR', 'ADMIN'] },
  { etiqueta: 'Bandeja', href: 'bandeja.html', roles: ['TECNICO', 'SUPERVISOR', 'ADMIN'] },
  { etiqueta: 'Dashboard', href: 'dashboard.html', roles: ['TECNICO', 'SUPERVISOR', 'ADMIN'] },
];

const INICIO = {
  ESTUDIANTE: 'mis-solicitudes.html',
  TECNICO: 'bandeja.html',
  SUPERVISOR: 'bandeja.html',
  ADMIN: 'dashboard.html',
};

export const rutaInicial = (rol) => INICIO[rol] ?? 'login.html';
export const menuPara = (rol) => ITEMS.filter((i) => i.roles.includes(rol));
export const puedeVer = (rol, href) => menuPara(rol).some((i) => i.href === href);
