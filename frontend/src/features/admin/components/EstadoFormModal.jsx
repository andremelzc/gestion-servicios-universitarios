import { useEffect, useId, useRef, useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import { avisoContraste } from '../contraste.js';
import { validarEstado } from '../validacion.js';
import CampoAdmin from './CampoAdmin.jsx';
import './adminUi.css';

const CAMPOS = ['nombreVisible', 'descripcion', 'colorHex'];
// Constante de módulo: un `{}` nuevo en cada render reiniciaría el efecto del foco.
const SIN_ERRORES = {};
const REGEX_HEX = /^#[0-9A-Fa-f]{6}$/;

/**
 * Muestra de color: círculo SVG (el `fill` es un atributo, no `style`, para no depender de
 * `style-src 'unsafe-inline'`) y el texto va aparte: el color nunca es el único indicador.
 * TODO: reemplazar por `EstadoBadge` cuando llegue a esta rama (cadena de #45).
 */
export function MuestraColor({ colorHex }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="16" height="16">
      <circle
        cx="8"
        cy="8"
        r="7"
        fill={REGEX_HEX.test(colorHex) ? colorHex : 'transparent'}
        stroke="currentColor"
      />
    </svg>
  );
}

function Formulario({ estado, onClose, onSubmit, isSaving, errorCampos }) {
  const id = useId();
  const formRef = useRef(null);
  const [valores, setValores] = useState({
    nombreVisible: estado.nombreVisible,
    descripcion: estado.descripcion ?? '',
    colorHex: estado.colorHex,
  });
  const [erroresLocales, setErroresLocales] = useState({});
  const [intentos, setIntentos] = useState(0);
  const errores = { ...errorCampos, ...erroresLocales };

  // El foco va al primer campo inválido solo tras un envío o un error nuevo del servidor; no
  // depende de `erroresLocales` (cambia al teclear) ni de un objeto nuevo en cada render.
  useEffect(() => {
    formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
  }, [intentos, errorCampos]);

  const cambiar = (campo) => (e) => {
    setValores((v) => ({ ...v, [campo]: e.target.value }));
    setErroresLocales((previos) =>
      Object.fromEntries(Object.entries(previos).filter(([otro]) => otro !== campo)),
    );
  };

  function enviar(evento) {
    evento.preventDefault();
    const resultado = validarEstado(valores);
    setErroresLocales(resultado.errores ?? {});
    setIntentos((n) => n + 1);
    if (resultado.datos) onSubmit(resultado.datos);
  }

  return (
    <form ref={formRef} className="admin-formulario" onSubmit={enviar} noValidate>
      <p className="admin-ayuda">
        El código ({estado.codigo}) y las transiciones entre estados no cambian.
      </p>
      <CampoAdmin id={`${id}-nombre`} etiqueta="Nombre visible" error={errores.nombreVisible}>
        <input value={valores.nombreVisible} onChange={cambiar('nombreVisible')} />
      </CampoAdmin>
      <CampoAdmin
        id={`${id}-descripcion`}
        etiqueta="Descripción (opcional)"
        error={errores.descripcion}
      >
        <textarea rows={3} value={valores.descripcion} onChange={cambiar('descripcion')} />
      </CampoAdmin>
      <CampoAdmin
        id={`${id}-color`}
        etiqueta="Color (#RRGGBB)"
        error={errores.colorHex}
        ayuda={avisoContraste(valores.colorHex.trim())}
        ayudaEnVivo
      >
        <input value={valores.colorHex} onChange={cambiar('colorHex')} maxLength={7} />
      </CampoAdmin>
      <div role="group" aria-label="Vista previa" className="admin-vista-previa">
        <MuestraColor colorHex={valores.colorHex.trim()} />
        <span>{valores.nombreVisible.trim() || 'Sin nombre'}</span>
      </div>
      <div className="admin-acciones">
        <button type="button" className="admin-boton" onClick={onClose} disabled={isSaving}>
          Cancelar
        </button>
        <button type="submit" className="admin-boton admin-boton--primario" disabled={isSaving}>
          {isSaving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

/**
 * Edición de la presentación de un estado (US-32, ADR-009): nombre visible, descripción y color.
 * `estado` es la fila (`{codigo, nombreVisible, descripcion, colorHex}`); no hay alta ni baja.
 * El aviso de contraste no bloquea el guardado. `errorGeneral`/`errorCampos` vienen de `useCrud`;
 * los errores de campos que el formulario no tiene se suman al aviso general.
 */
export default function EstadoFormModal({
  isOpen,
  estado,
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

  return (
    <Modal
      isOpen={isOpen && Boolean(estado)}
      titulo={`Editar estado ${estado?.nombreVisible ?? ''}`}
      onClose={onClose}
      closeOnEsc={!isSaving}
    >
      {general && (
        <p role="alert" className="admin-error">
          {general}
        </p>
      )}
      <Formulario {...{ estado, onClose, onSubmit, isSaving, errorCampos }} />
    </Modal>
  );
}
