// Pantalla de inicio de sesión (AUTH-16 · US-01, aceptación CA-1/CA-2, UAT-01).
// - Validación Zod con `LoginSchema` (AUTH-04): el login solo exige formato de correo;
//   el dominio institucional lo valida el servidor con 401.
// - Botón deshabilitado con spinner (`aria-busy`) durante el envío; errores por campo con
//   `aria-invalid` y los avisos generales en `role="alert"`.
// - El 401 de `/auth/login` se pinta aquí con el microcopy de UX §9: el mensaje genérico
//   de `interpretarError` para 401 es el de sesión expirada y no aplica al login.
// - Redirección por rol (UX §4.1, variante de CA-1): ESTUDIANTE → /mis-solicitudes ·
//   TECNICO/SUPERVISOR → /bandeja · ADMIN → /dashboard.
// - `consumirAvisoSesion()` (AUTH-15) muestra una sola vez el aviso de sesión expirada.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { consumirAvisoSesion } from '../../../services/apiClient.js';
import { interpretarError } from '../../../services/errores.js';
import { useAuth } from '../AuthContext.jsx';
import { LoginSchema } from '../schemas.js';
import './LoginPage.css';

const CAMPOS = ['correo', 'password'];

// UX §9 (CA-2). El 401 del login no usa el texto genérico de `errores.js` (sesión expirada).
const MSG_CREDENCIALES = 'Credenciales inválidas. Verifica tu correo y contraseña.';

// UX §4.1 (variante por rol de CA-1). Un rol inesperado cae al destino menos privilegiado.
const DESTINO_POR_ROL = {
  ESTUDIANTE: '/mis-solicitudes',
  TECNICO: '/bandeja',
  SUPERVISOR: '/bandeja',
  ADMIN: '/dashboard',
};

const VALORES_INICIALES = { correo: '', password: '' };

function aErroresPorCampo(errorZod) {
  const errores = {};
  for (const problema of errorZod.issues) {
    const campo = problema.path[0];
    if (campo && !errores[campo]) errores[campo] = problema.message;
  }
  return errores;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [valores, setValores] = useState(VALORES_INICIALES);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  // Aviso de una sola lectura que deja apiClient al expirar la sesión (AUTH-15).
  // Excepción legítima a `set-state-in-effect`: `sessionStorage` es una fuente externa,
  // no estado derivado del render.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const aviso = consumirAvisoSesion();
    if (aviso) setErrorGeneral(aviso);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

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

    const resultado = LoginSchema.safeParse(valores);
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
      const usuario = await login(resultado.data);
      navigate(DESTINO_POR_ROL[usuario?.rol] ?? '/mis-solicitudes', { replace: true });
    } catch (error) {
      if (error?.status === 401) {
        setErrorGeneral(MSG_CREDENCIALES);
      } else {
        const { general, campos } = interpretarError(error, CAMPOS);
        setErrores(campos);
        setErrorGeneral(general);
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="login">
      <h1 className="login__titulo">Iniciar sesión</h1>

      {errorGeneral && (
        <div className="login__alerta" role="alert">
          {errorGeneral}
        </div>
      )}

      <form className="login__form" noValidate onSubmit={alEnviar}>
        <div className="login__campo">
          <label htmlFor="correo">Correo institucional</label>
          <input
            id="correo"
            name="correo"
            type="email"
            autoComplete="email"
            placeholder="nombre@universidad.edu"
            value={valores.correo}
            onChange={alCambiarCampo('correo')}
            aria-invalid={Boolean(errores.correo)}
            aria-describedby={errores.correo ? 'error-correo' : undefined}
          />
          {errores.correo && (
            <p className="login__error" id="error-correo" role="alert">
              {errores.correo}
            </p>
          )}
        </div>

        <div className="login__campo">
          <label htmlFor="password">Contraseña</label>
          <div className="login__password">
            <input
              id="password"
              name="password"
              type={verPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={valores.password}
              onChange={alCambiarCampo('password')}
              aria-invalid={Boolean(errores.password)}
              aria-describedby={errores.password ? 'error-password' : undefined}
            />
            <button
              type="button"
              className="login__ver"
              aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setVerPassword((visible) => !visible)}
            >
              {verPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {errores.password && (
            <p className="login__error" id="error-password" role="alert">
              {errores.password}
            </p>
          )}
        </div>

        <button type="submit" className="login__enviar" disabled={enviando} aria-busy={enviando}>
          {enviando && <span className="login__spinner" aria-hidden="true" />}
          {enviando ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </button>
      </form>

      <p className="login__pie">
        ¿Primera vez? <Link to="/registro">Crear cuenta</Link>
      </p>
    </main>
  );
}
