// Pantalla de registro de estudiante (AUTH-17 · US-02/US-03, aceptación CA-5 y CA-8).
// - Validación Zod con los esquemas de AUTH-04 (mensajes de UX §9 donde existen).
// - Checklist de contraseña en vivo y botón deshabilitado mientras no cumpla (CA-8).
// - Dominio institucional bloqueado en cliente (CA-5); los 400 del servidor se pintan
//   por campo y el 409 (correo/código duplicado, CA-7) como alerta general.
// - Éxito: AuthContext hace el auto-login (CA-4) y se redirige a /mis-solicitudes.
//   El microcopy de bienvenida (UX §9) viaja en el state de la navegación para la
//   pantalla destino, igual que el aviso de sesión expirada de apiClient.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { interpretarError } from '../../../services/errores.js';
import { useAuth } from '../AuthContext.jsx';
import { REQUISITOS_PASSWORD, RegisterSchema, requisitosPassword } from '../schemas.js';
import './RegistroPage.css';

// Campos del contrato (RegistroRequest). El `errores` del backend que traiga claves
// desconocidas pasa al aviso general (comportamiento de `interpretarError`).
const CAMPOS = ['codigoInstitucional', 'nombre', 'apellido', 'correo', 'password'];

const VALORES_INICIALES = {
  codigoInstitucional: '',
  nombre: '',
  apellido: '',
  correo: '',
  password: '',
};

function aErroresPorCampo(errorZod) {
  const errores = {};
  for (const problema of errorZod.issues) {
    const campo = problema.path[0];
    if (campo && !errores[campo]) errores[campo] = problema.message;
  }
  return errores;
}

export default function RegistroPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [valores, setValores] = useState(VALORES_INICIALES);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const requisitos = requisitosPassword(valores.password);
  const passwordCumple = Object.values(requisitos).every(Boolean);
  const puedeEnviar = passwordCumple && !enviando;

  function alCambiarCampo(campo) {
    return (evento) => {
      const valor = evento.target.value;
      setValores((previos) => ({ ...previos, [campo]: valor }));
      setErrores((previos) => ({ ...previos, [campo]: undefined }));
      setErrorGeneral(null);
    };
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setErrorGeneral(null);

    const resultado = RegisterSchema.safeParse(valores);
    if (!resultado.success) {
      const nuevosErrores = aErroresPorCampo(resultado.error);
      setErrores(nuevosErrores);
      const primerCampo = CAMPOS.find((campo) => nuevosErrores[campo]);
      evento.target.elements[primerCampo]?.focus();
      return;
    }

    setErrores({});
    setEnviando(true);
    try {
      const usuario = await register(resultado.data);
      navigate('/mis-solicitudes', {
        replace: true,
        state: { aviso: `Cuenta creada. ¡Bienvenido/a, ${usuario.nombre}!` },
      });
    } catch (error) {
      const { general, campos } = interpretarError(error, CAMPOS);
      setErrores(campos);
      setErrorGeneral(general);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="registro">
      <h1 className="registro__titulo">Crear cuenta</h1>

      {errorGeneral && (
        <div className="registro__alerta" role="alert">
          {errorGeneral}
        </div>
      )}

      <form className="registro__form" noValidate onSubmit={alEnviar}>
        <div className="registro__campo">
          <label htmlFor="codigoInstitucional">Código institucional</label>
          <input
            id="codigoInstitucional"
            name="codigoInstitucional"
            type="text"
            autoComplete="off"
            value={valores.codigoInstitucional}
            onChange={alCambiarCampo('codigoInstitucional')}
            aria-invalid={Boolean(errores.codigoInstitucional)}
            aria-describedby={errores.codigoInstitucional ? 'error-codigoInstitucional' : undefined}
          />
          {errores.codigoInstitucional && (
            <p className="registro__error" id="error-codigoInstitucional" role="alert">
              {errores.codigoInstitucional}
            </p>
          )}
        </div>

        <div className="registro__fila">
          <div className="registro__campo">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              autoComplete="given-name"
              value={valores.nombre}
              onChange={alCambiarCampo('nombre')}
              aria-invalid={Boolean(errores.nombre)}
              aria-describedby={errores.nombre ? 'error-nombre' : undefined}
            />
            {errores.nombre && (
              <p className="registro__error" id="error-nombre" role="alert">
                {errores.nombre}
              </p>
            )}
          </div>

          <div className="registro__campo">
            <label htmlFor="apellido">Apellido</label>
            <input
              id="apellido"
              name="apellido"
              type="text"
              autoComplete="family-name"
              value={valores.apellido}
              onChange={alCambiarCampo('apellido')}
              aria-invalid={Boolean(errores.apellido)}
              aria-describedby={errores.apellido ? 'error-apellido' : undefined}
            />
            {errores.apellido && (
              <p className="registro__error" id="error-apellido" role="alert">
                {errores.apellido}
              </p>
            )}
          </div>
        </div>

        <div className="registro__campo">
          <label htmlFor="correo">Correo institucional</label>
          <input
            id="correo"
            name="correo"
            type="email"
            autoComplete="email"
            value={valores.correo}
            onChange={alCambiarCampo('correo')}
            aria-invalid={Boolean(errores.correo)}
            aria-describedby={errores.correo ? 'error-correo' : undefined}
          />
          {errores.correo && (
            <p className="registro__error" id="error-correo" role="alert">
              {errores.correo}
            </p>
          )}
        </div>

        <div className="registro__campo">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={valores.password}
            onChange={alCambiarCampo('password')}
            aria-invalid={Boolean(errores.password)}
            aria-describedby={
              errores.password ? 'requisitos-password error-password' : 'requisitos-password'
            }
          />
          {errores.password && (
            <p className="registro__error" id="error-password" role="alert">
              {errores.password}
            </p>
          )}
          <ul
            className="registro__checklist"
            id="requisitos-password"
            aria-label="Requisitos de la contraseña"
            aria-live="polite"
          >
            {REQUISITOS_PASSWORD.map(({ id, etiqueta }) => {
              const cumple = requisitos[id];
              return (
                <li key={id} data-cumple={cumple}>
                  <span aria-hidden="true" className="registro__checklist-icono">
                    {cumple ? '✔' : '✖'}
                  </span>
                  <span>{etiqueta}</span>
                  <span className="sr-only">{cumple ? ' (cumplido)' : ' (pendiente)'}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          type="submit"
          className="registro__enviar"
          disabled={!puedeEnviar}
          aria-busy={enviando}
        >
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="registro__pie">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </main>
  );
}
