import { iniciarApp } from '../shell.js';
import { api } from '../api.js';
import { iniciarListado } from '../lista.js';

if (await iniciarApp()) {
  await iniciarListado({
    cargar: api.misSolicitudes,
    vacio: {
      mensaje: 'Aún no tienes solicitudes. Crea la primera para empezar.',
      accion: { texto: 'Crear una solicitud', href: 'nueva-solicitud.html' },
    },
  });
}
