import { iniciarApp } from '../shell.js';
import { api } from '../api.js';
import { iniciarListado } from '../lista.js';

const auth = await iniciarApp();
if (auth) {
  await iniciarListado({
    cargar: api.bandeja,
    verTecnico: true,
    conGrupos: true,
    // El supervisor despacha: abre en "Por asignar" (UX §4.1).
    grupoInicial: auth.usuario.rol === 'SUPERVISOR' ? 'porAsignar' : 'todas',
    vacio: { mensaje: 'No hay solicitudes en tu bandeja por ahora.' },
  });
}
