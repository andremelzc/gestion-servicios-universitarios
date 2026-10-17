import { useEffect, useId, useRef, useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import { interpretarError } from '../../../services/errores.js';
import FileUploader from '../../solicitudes/components/FileUploader.jsx';
import { MAX_ARCHIVOS, validarArchivos } from '../../solicitudes/evidencias.js';
import './ModalResolucion.css';

const MIN_INFORME = 20;
const MAX_INFORME = 2000;
const CAMPOS = ['informe', 'archivos'];

const MSG_INFORME_CORTO = `El informe debe tener al menos ${MIN_INFORME} caracteres.`;
const MSG_SIN_EVIDENCIA = 'Adjunta al menos una evidencia de la solución.';
const MSG_ARCHIVO_INVALIDO = 'Corrige o quita los archivos con error antes de continuar.';

function FormularioResolucion({ solicitud, informeRef, onClose, onSubmit, isSubmitting, error }) {
  const id = useId();
  const archivosRef = useRef(null);
  const [informe, setInforme] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [errorLocal, setErrorLocal] = useState({});
  const { general, campos } = interpretarError(error, CAMPOS);
  const idInforme = `${id}-informe`;
  const idArchivos = `${id}-evidencia`;

  const enfocarArchivos = () => archivosRef.current?.querySelector('input[type="file"]')?.focus();

  // Con errores del servidor por campo, el foco va al primer campo inválido.
  useEffect(() => {
    const { campos: delServidor } = interpretarError(error, CAMPOS);
    if (delServidor.informe) informeRef.current?.focus();
    else if (delServidor.archivos) {
      archivosRef.current?.querySelector('input[type="file"]')?.focus();
    }
  }, [error, informeRef]);

  function enviar(evento) {
    evento.preventDefault();
    const texto = informe.trim();
    const errores = {};
    if (texto.length < MIN_INFORME) errores.informe = MSG_INFORME_CORTO;
    if (archivos.length === 0) errores.archivos = MSG_SIN_EVIDENCIA;
    else if (validarArchivos(archivos).length > 0) errores.archivos = MSG_ARCHIVO_INVALIDO;
    setErrorLocal(errores);
    if (errores.informe) return informeRef.current.focus();
    if (errores.archivos) return enfocarArchivos();
    onSubmit({ informe: texto, archivos });
  }

  const errorInforme = errorLocal.informe ?? campos.informe;
  const errorArchivos = errorLocal.archivos ?? campos.archivos;
  const idsInforme = [errorInforme && `${idInforme}-error`, `${idInforme}-ayuda`];

  return (
    <form className="modal-resolucion" onSubmit={enviar} noValidate>
      <p className="modal-resolucion__resumen">{solicitud.titulo}</p>

      <div className="modal-resolucion__campo">
        <label htmlFor={idInforme}>Informe técnico *</label>
        <textarea
          id={idInforme}
          ref={informeRef}
          rows={5}
          required
          maxLength={MAX_INFORME}
          readOnly={isSubmitting}
          value={informe}
          aria-invalid={errorInforme ? 'true' : undefined}
          aria-describedby={idsInforme.filter(Boolean).join(' ')}
          onChange={(e) => {
            setInforme(e.target.value);
            setErrorLocal((previo) => ({ ...previo, informe: undefined }));
          }}
        />
        <span id={`${idInforme}-ayuda`} className="modal-resolucion__contador">
          {`${informe.length} de ${MAX_INFORME} caracteres (mínimo ${MIN_INFORME})`}
        </span>
        {errorInforme && (
          <p id={`${idInforme}-error`} className="modal-resolucion__error">
            {errorInforme}
          </p>
        )}
      </div>

      <div ref={archivosRef}>
        <FileUploader
          id={idArchivos}
          etiqueta="Evidencia de la solución *"
          archivos={archivos}
          maxArchivos={MAX_ARCHIVOS}
          deshabilitado={isSubmitting}
          error={errorArchivos}
          onChange={(nuevos) => {
            setArchivos(nuevos);
            setErrorLocal((previo) => ({ ...previo, archivos: undefined }));
          }}
        />
      </div>

      {general && (
        <p role="alert" className="modal-resolucion__alerta">
          {general}
        </p>
      )}

      <div className="modal-resolucion__acciones">
        <button type="button" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </button>
        <button type="submit" className="modal-resolucion__primario" disabled={isSubmitting}>
          {isSubmitting ? 'Resolviendo…' : 'Marcar resuelta'}
        </button>
      </div>
    </form>
  );
}

/**
 * Modal de resolución (US-10, UX W-07). Presentacional: no consulta la API; lo alimenta el
 * contenedor de la bandeja del técnico.
 *
 * Props:
 * - isOpen, onClose: visibilidad y cierre (Esc y Cancelar; ambos se bloquean mientras `isSubmitting`).
 * - solicitud: `SolicitudDetalle` (api-rest §3.2); se usan `codigo` y `titulo`. Si es null no
 *   se renderiza nada. Al cerrar el modal el formulario se descarta (no conserva borradores).
 * - onSubmit({informe, archivos}): `informe` ya recortado (20–2000 caracteres) y `archivos` con
 *   1–3 `File` válidos (RN-12, CA-10/CA-11); solo se invoca si pasa esa validación local. El
 *   contenedor arma el `FormData` de `PUT …/resolver` (multipart): parte `datos` = Blob JSON
 *   `{informe}` (`application/json`) y una parte `archivos` por cada archivo.
 * - isSubmitting: bloquea envío, cierre, informe y selección de archivos.
 * - error: error normalizado `{status, detail, errores, traceId, tipo?}` (ADR-012). Los 400 por
 *   campo (`informe`, `archivos`) se asocian al campo y el primero recibe el foco; 403, 409,
 *   413 y 415 se muestran como alerta general.
 */
export default function ModalResolucion({
  isOpen,
  solicitud,
  onClose,
  onSubmit,
  isSubmitting = false,
  error = null,
}) {
  const informeRef = useRef(null);
  if (!isOpen || !solicitud) return null;

  return (
    <Modal
      isOpen
      titulo={`Resolver ${solicitud.codigo}`}
      onClose={onClose}
      closeOnEsc={!isSubmitting}
      initialFocusRef={informeRef}
    >
      <FormularioResolucion
        key={solicitud.id}
        {...{ solicitud, informeRef, onClose, onSubmit, isSubmitting, error }}
      />
    </Modal>
  );
}
