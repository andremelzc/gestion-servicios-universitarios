// Roles del sistema (RN-21, api-rest §3.6). `GET /roles` existe en el contrato, pero el conjunto es
// fijo, así que la pantalla de usuarios usa esta lista y no hace otra petición.
export const ROLES = [
  { codigo: 'ESTUDIANTE', etiqueta: 'Estudiante' },
  { codigo: 'TECNICO', etiqueta: 'Técnico' },
  { codigo: 'SUPERVISOR', etiqueta: 'Supervisor' },
  { codigo: 'ADMIN', etiqueta: 'Administrador' },
];

// RN-21: solo TECNICO y SUPERVISOR llevan área; ESTUDIANTE y ADMIN no la admiten.
export const ROLES_CON_AREA = ['TECNICO', 'SUPERVISOR'];

export const etiquetaRol = (codigo) => ROLES.find((r) => r.codigo === codigo)?.etiqueta ?? codigo;
