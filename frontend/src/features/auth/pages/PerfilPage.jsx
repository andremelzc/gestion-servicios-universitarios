import { useEffect, useState } from 'react';
import Alert from '../../../components/ui/Alert.jsx';
import Button from '../../../components/ui/Button.jsx';
import Card from '../../../components/ui/Card.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import { apiClient } from '../../../services/apiClient.js';
import { areasApi } from '../../../services/areas.api.js';
import { interpretarError } from '../../../services/errores.js';
import CampoAdmin from '../../admin/components/CampoAdmin.jsx';
import '../../admin/components/adminUi.css';
import { useAuth } from '../AuthContext.jsx';
import { CambiarPasswordSchema, REQUISITOS_PASSWORD, requisitosPassword } from '../schemas.js';
import './PerfilPage.css';

const ETIQUETA_ROL = {
  ESTUDIANTE: 'Estudiante',
  TECNICO: 'Técnico',
  SUPERVISOR: 'Supervisor',
  ADMIN: 'Administrador',
};

const VACIO = { passwordActual: '', nuevaPassword: '', confirmar: '' };

// Primer mensaje de Zod por campo.
function erroresPorCampo(errorZod) {
  const errores = {};
  for (const issue of errorZod.issues) {
    const campo = issue.path[0];
    if (campo && !errores[campo]) errores[campo] = issue.message;
  }
  return errores;
}

/**
 * Perfil (UX W-10): datos de la cuenta y cambio de contraseña (US-18, `PUT /auth/cambiar-password`).
 */
export default function PerfilPage() {
  const { usuario } = useAuth();
  const [area, setArea] = useState(null);
  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [exito, setExito] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // El nombre del área es informativo: si la consulta falla, simplemente no se muestra.
  useEffect(() => {
    if (usuario?.idArea == null) return undefined;
    const control = new AbortController();
    areasApi.listar({ signal: control.signal }).then(
      (respuesta) => {
        const lista = Array.isArray(respuesta) ? respuesta : (respuesta?.content ?? []);
        const encontrada = lista.find((a) => a.id === usuario.idArea);
        if (!control.signal.aborted && encontrada) setArea(encontrada.nombre);
      },
      () => {},
    );
    return () => control.abort();
  }, [usuario?.idArea]);

  const requisitos = requisitosPassword(valores.nuevaPassword);

  function cambiar(campo) {
    return (evento) => {
      const valor = evento.target.value;
      setValores((previos) => ({ ...previos, [campo]: valor }));
      setErrores((previos) => ({ ...previos, [campo]: undefined }));
      setErrorGeneral(null);
      setExito(false);
    };
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErrorGeneral(null);
    setExito(false);

    const resultado = CambiarPasswordSchema.safeParse({
      passwordActual: valores.passwordActual,
      nuevaPassword: valores.nuevaPassword,
    });
    const nuevos = resultado.success ? {} : erroresPorCampo(resultado.error);
    if (valores.confirmar !== valores.nuevaPassword) {
      nuevos.confirmar = 'Las contraseñas no coinciden.';
    }
    if (Object.keys(nuevos).length > 0) {
      setErrores(nuevos);
      const primero = ['passwordActual', 'nuevaPassword', 'confirmar'].find((c) => nuevos[c]);
      evento.target.elements[primero]?.focus();
      return;
    }

    setErrores({});
    setEnviando(true);
    try {
      await apiClient.put('/auth/cambiar-password', resultado.data);
      setValores(VACIO);
      setExito(true);
    } catch (error) {
      const { general, campos } = interpretarError(error, ['passwordActual', 'nuevaPassword']);
      setErrores(campos);
      setErrorGeneral(general || 'No se pudo cambiar la contraseña.');
    } finally {
      setEnviando(false);
    }
  }

  const nombre = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ');

  return (
    <main className="perfil">
      <PageHeader
        titulo="Perfil"
        descripcion="Tus datos de cuenta y la seguridad de tu acceso."
        icono="user"
      />

      <div className="perfil__grid">
        <Card titulo="Mis datos" icono="user">
          <dl className="perfil__datos">
            <div>
              <dt>Nombre</dt>
              <dd>{nombre || 'Sin dato'}</dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>{usuario?.correo || 'Sin dato'}</dd>
            </div>
            <div>
              <dt>Rol</dt>
              <dd>{ETIQUETA_ROL[usuario?.rol] ?? usuario?.rol ?? 'Sin dato'}</dd>
            </div>
            <div>
              <dt>Área</dt>
              <dd>{usuario?.idArea == null ? 'Sin área' : (area ?? `Área ${usuario.idArea}`)}</dd>
            </div>
          </dl>
        </Card>

        <Card titulo="Cambiar contraseña" icono="shield" tono="violeta">
          <form className="perfil__form" noValidate onSubmit={enviar}>
            {errorGeneral && <Alert tipo="error">{errorGeneral}</Alert>}
            <CampoAdmin
              id="passwordActual"
              etiqueta="Contraseña actual"
              error={errores.passwordActual}
            >
              <input
                name="passwordActual"
                type="password"
                autoComplete="current-password"
                value={valores.passwordActual}
                onChange={cambiar('passwordActual')}
              />
            </CampoAdmin>
            <CampoAdmin
              id="nuevaPassword"
              etiqueta="Nueva contraseña"
              error={errores.nuevaPassword}
            >
              <input
                name="nuevaPassword"
                type="password"
                autoComplete="new-password"
                value={valores.nuevaPassword}
                onChange={cambiar('nuevaPassword')}
              />
            </CampoAdmin>
            <ul className="perfil__checklist" aria-label="Requisitos de la contraseña">
              {REQUISITOS_PASSWORD.map(({ id, etiqueta }) => {
                const cumple = requisitos[id];
                return (
                  <li key={id} data-cumple={cumple}>
                    <span aria-hidden="true">{cumple ? '✔' : '✖'}</span> {etiqueta}
                    <span className="sr-only">{cumple ? ' (cumplido)' : ' (pendiente)'}</span>
                  </li>
                );
              })}
            </ul>
            <CampoAdmin
              id="confirmar"
              etiqueta="Confirmar nueva contraseña"
              error={errores.confirmar}
            >
              <input
                name="confirmar"
                type="password"
                autoComplete="new-password"
                value={valores.confirmar}
                onChange={cambiar('confirmar')}
              />
            </CampoAdmin>
            <div role="status">
              {exito && (
                <Alert tipo="exito" role={null}>
                  Contraseña actualizada.
                </Alert>
              )}
            </div>
            <Button type="submit" icono="check" cargando={enviando} className="perfil__guardar">
              {enviando ? 'Guardando…' : 'Guardar'}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
