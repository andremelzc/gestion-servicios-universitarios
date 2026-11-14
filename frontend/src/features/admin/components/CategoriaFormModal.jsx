import { useEffect, useId, useRef, useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import { validarCategoria } from '../validacionCatalogos.js';
import CampoAdmin from './CampoAdmin.jsx';
import Select from '../../../components/ui/Select.jsx';
import './adminUi.css';

const CAMPOS = ['nombre', 'descripcion', 'idArea', 'tiempoSlaHoras'];
// Constantes de módulo: un `{}` o `[]` nuevo en cada render reiniciaría el efecto del foco.
const SIN_ERRORES = {};
const SIN_AREAS = [];

function Formulario({ categoria, areas, onClose, onSubmit, isSaving, errorCampos }) {
  const id = useId();
  const formRef = useRef(null);
  const [valores, setValores] = useState({
    nombre: categoria?.nombre ?? '',
    descripcion: categoria?.descripcion ?? '',
    idArea: categoria ? String(categoria.idArea) : '',
    tiempoSlaHoras: categoria ? String(categoria.tiempoSlaHoras) : '',
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
    const resultado = validarCategoria(valores);
    setErroresLocales(resultado.errores ?? {});
    setIntentos((n) => n + 1);
    if (resultado.datos) onSubmit(resultado.datos);
  }

  // La categoría editada puede pertenecer a un área ya inactiva (no viene en `areas`): se
  // conserva como opción para no perder el valor al guardar.
  const sinArea = categoria && !areas.some((a) => a.id === categoria.idArea);

  return (
    <form ref={formRef} className="admin-formulario" onSubmit={enviar} noValidate>
      <CampoAdmin id={`${id}-nombre`} etiqueta="Nombre" error={errores.nombre}>
        <input value={valores.nombre} onChange={cambiar('nombre')} maxLength={80} />
      </CampoAdmin>
      <CampoAdmin id={`${id}-descripcion`} etiqueta="Descripción" error={errores.descripcion}>
        <textarea
          rows={3}
          value={valores.descripcion}
          onChange={cambiar('descripcion')}
          maxLength={255}
        />
      </CampoAdmin>
      <CampoAdmin id={`${id}-area`} etiqueta="Área responsable" error={errores.idArea}>
        <Select value={valores.idArea} onChange={cambiar('idArea')}>
          <option value="">Selecciona un área</option>
          {sinArea && <option value={categoria.idArea}>{categoria.area}</option>}
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.nombre}
            </option>
          ))}
        </Select>
      </CampoAdmin>
      <CampoAdmin
        id={`${id}-sla`}
        etiqueta="SLA estándar (horas)"
        error={errores.tiempoSlaHoras}
        ayuda="Tiempo máximo de atención de las solicitudes nuevas de esta categoría."
      >
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={valores.tiempoSlaHoras}
          onChange={cambiar('tiempoSlaHoras')}
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
 * Alta y edición de una categoría (US-15). `categoria` null = alta. `areas` son las áreas activas
 * para el selector; `errorAreas` avisa si no se pudieron cargar. `onSubmit(datos)` recibe los
 * datos ya validados; `errorGeneral` y `errorCampos` vienen de `useAccionesCrud`.
 */
export default function CategoriaFormModal({
  isOpen,
  categoria = null,
  areas = SIN_AREAS,
  errorAreas = false,
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
      titulo={categoria ? `Editar categoría ${categoria.nombre}` : 'Nueva categoría'}
      onClose={onClose}
      closeOnEsc={!isSaving}
    >
      {general && (
        <p role="alert" className="admin-error">
          {general}
        </p>
      )}
      {errorAreas && (
        <p role="alert" className="admin-error">
          No se pudieron cargar las áreas.
        </p>
      )}
      <Formulario {...{ categoria, areas, onClose, onSubmit, isSaving, errorCampos }} />
    </Modal>
  );
}
