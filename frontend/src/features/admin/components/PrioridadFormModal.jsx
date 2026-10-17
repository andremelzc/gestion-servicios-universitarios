import { useEffect, useId, useRef, useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import { validarPrioridad } from '../validacion.js';
import CampoAdmin from './CampoAdmin.jsx';
import './adminUi.css';

const CAMPOS = ['nivel', 'ponderador', 'slaMaxHoras'];

function Formulario({ prioridad, onClose, onSubmit, isSaving, errorCampos }) {
  const id = useId();
  const formRef = useRef(null);
  const [valores, setValores] = useState({
    nivel: prioridad?.nivel ?? '',
    ponderador: prioridad ? String(prioridad.ponderador) : '',
    slaMaxHoras: prioridad ? String(prioridad.slaMaxHoras) : '',
  });
  const [erroresLocales, setErroresLocales] = useState({});
  const errores = { ...errorCampos, ...erroresLocales };

  // Con errores (locales o del servidor) el foco va al primer campo inválido.
  useEffect(() => {
    formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
  }, [erroresLocales, errorCampos]);

  const cambiar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }));

  function enviar(evento) {
    evento.preventDefault();
    const resultado = validarPrioridad(valores);
    setErroresLocales(resultado.errores ?? {});
    if (resultado.datos) onSubmit(resultado.datos);
  }

  return (
    <form ref={formRef} className="admin-formulario" onSubmit={enviar} noValidate>
      <CampoAdmin id={`${id}-nivel`} etiqueta="Nivel" error={errores.nivel}>
        <input value={valores.nivel} onChange={cambiar('nivel')} maxLength={20} />
      </CampoAdmin>
      <CampoAdmin id={`${id}-ponderador`} etiqueta="Urgencia" error={errores.ponderador}>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={valores.ponderador}
          onChange={cambiar('ponderador')}
        />
      </CampoAdmin>
      <CampoAdmin
        id={`${id}-sla`}
        etiqueta="SLA máximo (horas)"
        error={errores.slaMaxHoras}
        ayuda={
          prioridad
            ? 'El cambio aplica solo a las solicitudes nuevas; las existentes conservan su fecha límite.'
            : undefined
        }
      >
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={valores.slaMaxHoras}
          onChange={cambiar('slaMaxHoras')}
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
 * Alta y edición de una prioridad (US-31). `prioridad` null = alta. `onSubmit(datos)` recibe los
 * datos ya validados; `errorGeneral` y `errorCampos` vienen de `errorMutacion` de `useCrud`.
 * Los errores de campos que el formulario no tiene se suman al aviso general.
 */
export default function PrioridadFormModal({
  isOpen,
  prioridad = null,
  onClose,
  onSubmit,
  isSaving = false,
  errorGeneral = null,
  errorCampos = {},
}) {
  const ajenos = Object.entries(errorCampos)
    .filter(([campo]) => !CAMPOS.includes(campo))
    .map(([, mensaje]) => mensaje);
  const general = [errorGeneral, ...ajenos].filter(Boolean).join(' ');

  return (
    <Modal
      isOpen={isOpen}
      titulo={prioridad ? `Editar prioridad ${prioridad.nivel}` : 'Nueva prioridad'}
      onClose={onClose}
      closeOnEsc={!isSaving}
    >
      {general && (
        <p role="alert" className="admin-error">
          {general}
        </p>
      )}
      <Formulario {...{ prioridad, onClose, onSubmit, isSaving, errorCampos }} />
    </Modal>
  );
}
