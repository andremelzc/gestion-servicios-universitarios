import { api } from '../api.js';
import { sesion } from '../auth.js';
import { validarCorreo, validarPassword, evaluarPassword, validarRegistro } from '../lib/validation.js';
import { rutaInicial } from '../lib/roles.js';
import { enlazarValidacion, aplicarErroresServidor, enlazarMostrarPassword } from '../forms.js';
import { el, marcarCargando, toast } from '../ui.js';

const formulario = document.getElementById('form-registro');
const aviso = document.getElementById('aviso');
const boton = document.getElementById('enviar');
const reglasUi = document.querySelectorAll('#password-reglas [data-regla]');

enlazarMostrarPassword(document.getElementById('ver-password'), formulario.elements.password);

// Reutiliza validarRegistro campo a campo para no duplicar reglas.
const regla = (campo) => (valor) => {
  const datos = Object.fromEntries(new FormData(formulario));
  datos[campo] = valor;
  return validarRegistro(datos)[campo] ?? null;
};

const actualizarChecklist = () => {
  const { reglas } = evaluarPassword(formulario.elements.password.value, formulario.elements.correo.value);
  for (const li of reglasUi) li.dataset.ok = String(reglas[li.dataset.regla]);
};

const validarTodo = enlazarValidacion(
  formulario,
  {
    codigoInstitucional: regla('codigoInstitucional'),
    nombre: regla('nombre'),
    apellido: regla('apellido'),
    correo: (v) => validarCorreo(v, { institucional: true }),
    password: (v) => validarPassword(v, formulario.elements.correo.value),
  },
  { alCambiar: (campo) => campo.id === 'password' && actualizarChecklist() },
);

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  aviso.replaceChildren();
  if (!validarTodo()) return;

  marcarCargando(boton, true, 'Creando cuenta…');
  try {
    const datos = Object.fromEntries(new FormData(formulario));
    datos.correo = datos.correo.trim();
    const auth = await api.registro(datos);
    sesion.guardar(auth);
    toast(`Cuenta creada. ¡Bienvenido/a, ${auth.usuario.nombre}!`, 'success');
    setTimeout(() => window.location.replace(rutaInicial(auth.usuario.rol)), 900);
  } catch (error) {
    marcarCargando(boton, false);
    const { problema } = error;
    if (!problema) throw error;
    if (problema.status === 400 && aplicarErroresServidor(formulario, problema.errores)) return;
    aviso.replaceChildren(el('p', { class: 'alert alert--error', text: problema.mensaje }));
  }
});
