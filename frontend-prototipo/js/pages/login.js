import { api } from '../api.js';
import { sesion } from '../auth.js';
import { validarCorreo, MENSAJES } from '../lib/validation.js';
import { rutaInicial } from '../lib/roles.js';
import { enlazarValidacion, aplicarErroresServidor, enlazarMostrarPassword } from '../forms.js';
import { el, marcarCargando } from '../ui.js';

const previa = sesion.leer();
if (previa) window.location.replace(rutaInicial(previa.usuario.rol));

const formulario = document.getElementById('form-login');
const aviso = document.getElementById('aviso');
const boton = document.getElementById('enviar');

if (new URLSearchParams(window.location.search).get('expirada')) {
  aviso.append(el('p', { class: 'alert alert--info', text: 'Tu sesión expiró. Inicia sesión de nuevo.' }));
}

enlazarMostrarPassword(document.getElementById('ver-password'), formulario.elements.password);

const validarTodo = enlazarValidacion(formulario, {
  correo: (v) => validarCorreo(v),
  password: (v) => (v ? null : MENSAJES.passwordRequerida),
});

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  aviso.replaceChildren();
  if (!validarTodo()) return;

  marcarCargando(boton, true, 'Ingresando…');
  try {
    const auth = await api.login({
      correo: formulario.elements.correo.value.trim(),
      password: formulario.elements.password.value,
    });
    sesion.guardar(auth);
    window.location.replace(rutaInicial(auth.usuario.rol));
  } catch (error) {
    marcarCargando(boton, false);
    const { problema } = error;
    if (!problema) throw error;
    if (problema.status === 400 && aplicarErroresServidor(formulario, problema.errores)) return;
    aviso.replaceChildren(el('p', { class: 'alert alert--error', text: problema.mensaje }));
  }
});
