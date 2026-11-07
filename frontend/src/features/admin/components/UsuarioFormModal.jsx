import { useEffect, useId, useRef, useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import { ROLES, ROLES_CON_AREA } from '../roles.js';
import { validarUsuario } from '../validacion.usuario.js';
import CampoAdmin from './CampoAdmin.jsx';
import './adminUi.css';

const CAMPOS = [
  'codigoInstitucional',
  'nombre',
  'apellido',
  'correo',
  'telefono',
  'password',
  'rol',
  'idArea',
];
// Constantes de módulo: un `{}` o `[]` nuevo en cada render reiniciaría el efecto del foco.
const SIN_ERRORES = {};
const SIN_AREAS = [];

function Formulario({
  usuario,
  areas,
  errorAreas,
  onReintentarAreas,
  onClose,
  onSubmit,
  isSaving,
  errorCampos,
}) {
  const id = useId();
  const formRef = useRef(null);
  const modo = usuario ? 'edicion' : 'alta';
  const [valores, setValores] = useState({
    codigoInstitucional: usuario?.codigoInstitucional ?? '',
    nombre: usuario?.nombre ?? '',
    apellido: usuario?.apellido ?? '',
    correo: usuario?.correo ?? '',
    telefono: usuario?.telefono ?? '',
    password: '',
    rol: usuario?.rol ?? '',
    idArea: usuario?.idArea == null ? '' : String(usuario.idArea),
  });
  const [erroresLocales, setErroresLocales] = useState({});
  const [intentos, setIntentos] = useState(0);
  const errores = { ...errorCampos, ...erroresLocales };
  const pideArea = ROLES_CON_AREA.includes(valores.rol);
  // Con un rol que exige área y sin áreas por un fallo de carga, guardar es imposible (RN-21).
  const sinAreasPorError = pideArea && errorAreas && areas.length === 0;

  // El foco va al primer campo inválido solo tras un envío o un error nuevo del servidor.
  useEffect(() => {
    formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
  }, [intentos, errorCampos]);

  const quitarError = (campo) =>
    setErroresLocales((previos) =>
      Object.fromEntries(Object.entries(previos).filter(([otro]) => otro !== campo)),
    );

  const cambiar = (campo) => (e) => {
    setValores((v) => ({ ...v, [campo]: e.target.value }));
    quitarError(campo);
  };

  // RN-21: al pasar a un rol sin área se descarta la que hubiera elegido.
  const cambiarRol = (e) => {
    const rol = e.target.value;
    setValores((v) => ({
      ...v,
      rol,
      idArea: ROLES_CON_AREA.includes(rol) ? v.idArea : '',
    }));
    quitarError('rol');
    quitarError('idArea');
  };

  function enviar(evento) {
    evento.preventDefault();
    const resultado = validarUsuario(valores, modo);
    setErroresLocales(resultado.errores ?? {});
    setIntentos((n) => n + 1);
    if (resultado.datos) onSubmit(resultado.datos);
  }

  const campoTexto = (campo, etiqueta, { ayuda, soloAlta, ...atributos } = {}) => (
    <CampoAdmin id={`${id}-${campo}`} etiqueta={etiqueta} error={errores[campo]} ayuda={ayuda}>
      <input
        value={valores[campo]}
        onChange={cambiar(campo)}
        readOnly={soloAlta && modo === 'edicion'}
        {...atributos}
      />
    </CampoAdmin>
  );

  return (
    <form ref={formRef} className="admin-formulario" onSubmit={enviar} noValidate>
      {campoTexto('codigoInstitucional', 'Código institucional', {
        soloAlta: true,
        maxLength: 20,
        ayuda: usuario ? 'El código no se puede cambiar.' : undefined,
      })}
      {campoTexto('nombre', 'Nombre', { maxLength: 50 })}
      {campoTexto('apellido', 'Apellido', { maxLength: 50 })}
      {campoTexto('correo', 'Correo', {
        soloAlta: true,
        type: 'email',
        ayuda: usuario ? 'El correo no se puede cambiar.' : undefined,
      })}
      {campoTexto('telefono', 'Teléfono (opcional)', { type: 'tel', maxLength: 20 })}
      {modo === 'alta' &&
        campoTexto('password', 'Contraseña inicial', {
          type: 'password',
          autoComplete: 'new-password',
          ayuda: 'Mínimo 8 caracteres, una mayúscula y un número.',
        })}
      <CampoAdmin id={`${id}-rol`} etiqueta="Rol" error={errores.rol}>
        <select value={valores.rol} onChange={cambiarRol}>
          <option value="">Selecciona un rol</option>
          {ROLES.map((r) => (
            <option key={r.codigo} value={r.codigo}>
              {r.etiqueta}
            </option>
          ))}
        </select>
      </CampoAdmin>
      {pideArea && (
        <CampoAdmin
          id={`${id}-area`}
          etiqueta="Área"
          error={errores.idArea}
          ayuda="Obligatoria para técnicos y supervisores."
        >
          <select value={valores.idArea} onChange={cambiar('idArea')}>
            <option value="">Selecciona un área</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </CampoAdmin>
      )}
      {sinAreasPorError && (
        <p role="alert" className="admin-error">
          No se pudieron cargar las áreas, por eso no se puede guardar con este rol.{' '}
          <button type="button" className="admin-boton" onClick={onReintentarAreas}>
            Reintentar
          </button>
        </p>
      )}
      <div className="admin-acciones">
        <button type="button" className="admin-boton" onClick={onClose} disabled={isSaving}>
          Cancelar
        </button>
        <button
          type="submit"
          className="admin-boton admin-boton--primario"
          disabled={isSaving || sinAreasPorError}
        >
          {isSaving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

/**
 * Alta y edición de un usuario (US-17, US-34). `usuario` null = alta. `areas` alimenta el
 * selector, que solo aparece con un rol que exige área (RN-21). `onSubmit(datos)` recibe los
 * datos ya validados; `errorGeneral` y `errorCampos` vienen de `errorMutacion` de `useCrud`.
 * Los errores de campos que el formulario no tiene se suman al aviso general.
 */
export default function UsuarioFormModal({
  isOpen,
  usuario = null,
  areas = SIN_AREAS,
  errorAreas = false,
  onReintentarAreas,
  onClose,
  onSubmit,
  isSaving = false,
  errorGeneral = null,
  errorCampos = SIN_ERRORES,
}) {
  const ajenos = Object.entries(errorCampos)
    .filter(([campo]) => !CAMPOS.includes(campo))
    .map(([, mensaje]) => mensaje);
  const general = [errorGeneral, ...ajenos].filter(Boolean).join(' ');
  const nombre = usuario ? `${usuario.nombre} ${usuario.apellido}` : '';

  return (
    <Modal
      isOpen={isOpen}
      titulo={usuario ? `Editar usuario ${nombre}` : 'Nuevo usuario'}
      onClose={onClose}
      closeOnEsc={!isSaving}
    >
      {general && (
        <p role="alert" className="admin-error">
          {general}
        </p>
      )}
      <Formulario
        {...{
          usuario,
          areas,
          errorAreas,
          onReintentarAreas,
          onClose,
          onSubmit,
          isSaving,
          errorCampos,
        }}
      />
    </Modal>
  );
}
