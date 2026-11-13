import { useEffect, useId, useRef, useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import { validarArea } from '../validacionCatalogos.js';
import CampoAdmin from './CampoAdmin.jsx';
import './adminUi.css';

const CAMPOS = ['nombre', 'correoContacto'];
// Constante de módulo: un `{}` nuevo en cada render reiniciaría el efecto del foco.
const SIN_ERRORES = {};

function Formulario({ area, onClose, onSubmit, isSaving, errorCampos }) {
  const id = useId();
  const formRef = useRef(null);
  const [valores, setValores] = useState({
    nombre: area?.nombre ?? '',
    correoContacto: area?.correoContacto ?? '',
  });
  const [erroresLocales, setErroresLocales] = useState({});
  const [intentos, setIntentos] = useState(0);
  const errores = { ...errorCampos, ...erroresLocales };

  // El foco va al primer campo inválido solo tras un envío o un error nuevo del servidor.
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
    const resultado = validarArea(valores);
    setErroresLocales(resultado.errores ?? {});
    setIntentos((n) => n + 1);
    if (resultado.datos) onSubmit(resultado.datos);
  }

  return (
    <form ref={formRef} className="admin-formulario" onSubmit={enviar} noValidate>
      <CampoAdmin id={`${id}-nombre`} etiqueta="Nombre" error={errores.nombre}>
        <input value={valores.nombre} onChange={cambiar('nombre')} maxLength={100} />
      </CampoAdmin>
      <CampoAdmin id={`${id}-correo`} etiqueta="Correo de contacto" error={errores.correoContacto}>
        <input
          type="email"
          value={valores.correoContacto}
          onChange={cambiar('correoContacto')}
          maxLength={100}
        />
      </CampoAdmin>
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
 * Alta y edición de un área (US-16). `area` null = alta. `onSubmit(datos)` recibe los datos ya
 * validados; `errorGeneral` y `errorCampos` vienen de `useAccionesCrud`. Los errores de campos
 * que el formulario no tiene se suman al aviso general.
 */
export default function AreaFormModal({
  isOpen,
  area = null,
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
      isOpen={isOpen}
      titulo={area ? `Editar área ${area.nombre}` : 'Nueva área'}
      onClose={onClose}
      closeOnEsc={!isSaving}
    >
      {general && (
        <p role="alert" className="admin-error">
          {general}
        </p>
      )}
      <Formulario {...{ area, onClose, onSubmit, isSaving, errorCampos }} />
    </Modal>
  );
}
