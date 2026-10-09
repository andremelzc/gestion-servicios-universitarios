// Punto de entrada: redirige según la sesión (o al login).
import { sesion } from '../auth.js';
import { rutaInicial } from '../lib/roles.js';

const auth = sesion.leer();
window.location.replace(auth ? rutaInicial(auth.usuario.rol) : 'login.html');
