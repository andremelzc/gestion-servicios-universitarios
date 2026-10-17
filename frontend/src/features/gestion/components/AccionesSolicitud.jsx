import { useEffect, useRef, useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import './AccionesSolicitud.css';

// Códigos de `accionesPermitidas` (api-rest §3.2) en el orden en que se muestran. El orden lo fija
// el frontend para que la barra no cambie de sitio; qué acciones aparecen lo decide solo el backend.
const ACCIONES = [
  { codigo: 'EVALUAR', etiqueta: 'Evaluar' },
  { codigo: 'ASIGNAR', etiqueta: 'Asignar' },
  { codigo: 'INICIAR_ATENCION', etiqueta: 'Iniciar atención' },
  { codigo: 'RESOLVER', etiqueta: 'Resolver' },
  { codigo: 'COMENTAR', etiqueta: 'Comentar' },
  // Cierra la solicitud de forma definitiva: pide confirmación y se dibuja como destructiva.
  { codigo: 'CERRAR', etiqueta: 'Cerrar solicitud', simbolo: '⊗', destructiva: true },
];

const PRIMARIAS = new Set(['EVALUAR', 'ASIGNAR', 'INICIAR_ATENCION', 'RESOLVER']);

/**
 * Botones de acción del detalle de una solicitud (UX W-05, "Mostrar solo lo permitido").
 * Presentacional: no llama a la API ni aplica reglas de rol o estado; esas reglas las calcula el
 * backend y llegan en `accionesPermitidas`. Los códigos desconocidos se ignoran.
 *
 * Props:
 * - acciones: arreglo de códigos (`accionesPermitidas`); cualquier otro valor equivale a vacío.
 * - onAccion: se invoca con el código al pulsar una acción; "CERRAR" solo tras confirmar.
 * - accionEnCurso: código de la acción que se está ejecutando; bloquea todas y marca esa como ocupada.
 * - deshabilitado: bloquea todas las acciones sin marcar ninguna como ocupada.
 */
export default function AccionesSolicitud({
  acciones,
  onAccion,
  accionEnCurso = null,
  deshabilitado = false,
}) {
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);
  const grupoRef = useRef(null);
  const botonCerrarRef = useRef(null);
  const cancelarRef = useRef(null);
  // Al cerrar la confirmación el foco vuelve al botón "Cerrar solicitud"; si ya no existe (el
  // cierre se concretó y la acción dejó de estar permitida) pasa al grupo, nunca a <body>.
  // `current` se lee recién al cerrar el modal, con el DOM ya actualizado.
  const [destinoFocoRef] = useState(() => ({
    get current() {
      return botonCerrarRef.current ?? grupoRef.current;
    },
  }));

  const tieneCerrar = Array.isArray(acciones) && acciones.includes('CERRAR');
  const teniaCerrarRef = useRef(tieneCerrar);
  // Si "Cerrar solicitud" desaparece con el foco puesto en él, el navegador lo suelta en <body>:
  // se rescata hacia el grupo para que el usuario de teclado no pierda su lugar.
  useEffect(() => {
    if (teniaCerrarRef.current && !tieneCerrar && document.activeElement === document.body) {
      grupoRef.current?.focus();
    }
    teniaCerrarRef.current = tieneCerrar;
  }, [tieneCerrar]);

  const permitidas = new Set(Array.isArray(acciones) ? acciones : []);
  const visibles = ACCIONES.filter((accion) => permitidas.has(accion.codigo));
  if (visibles.length === 0) return null;

  const bloqueado = deshabilitado || accionEnCurso !== null;

  function alPulsar(codigo) {
    if (bloqueado) return;
    if (codigo === 'CERRAR') setConfirmandoCierre(true);
    else onAccion(codigo);
  }

  function confirmarCierre() {
    if (bloqueado) return;
    setConfirmandoCierre(false);
    onAccion('CERRAR');
  }

  return (
    <div className="acciones-solicitud">
      <div
        ref={grupoRef}
        tabIndex={-1}
        role="group"
        aria-label="Acciones de la solicitud"
        className="acciones-solicitud__grupo"
      >
        {visibles.map(({ codigo, etiqueta, simbolo, destructiva }) => {
          const clases = ['acciones-solicitud__boton'];
          if (destructiva) clases.push('acciones-solicitud__boton--destructiva');
          else if (PRIMARIAS.has(codigo)) clases.push('acciones-solicitud__boton--primaria');
          return (
            <button
              key={codigo}
              ref={codigo === 'CERRAR' ? botonCerrarRef : undefined}
              type="button"
              className={clases.join(' ')}
              aria-disabled={bloqueado ? 'true' : undefined}
              aria-busy={accionEnCurso === codigo ? 'true' : undefined}
              onClick={() => alPulsar(codigo)}
            >
              {simbolo && <span aria-hidden="true">{simbolo}</span>}
              {etiqueta}
            </button>
          );
        })}
      </div>
      <p role="status" className="acciones-solicitud__estado">
        {accionEnCurso !== null && 'Procesando…'}
      </p>
      <Modal
        isOpen={confirmandoCierre}
        titulo="Cerrar solicitud"
        role="alertdialog"
        descripcion="La solicitud pasará a Cerrada y ya no admitirá cambios. Esta acción no se puede deshacer."
        initialFocusRef={cancelarRef}
        returnFocusRef={destinoFocoRef}
        onClose={() => setConfirmandoCierre(false)}
      >
        <div className="acciones-solicitud__confirmacion">
          <button
            ref={cancelarRef}
            type="button"
            className="acciones-solicitud__boton"
            onClick={() => setConfirmandoCierre(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="acciones-solicitud__boton acciones-solicitud__boton--destructiva"
            aria-disabled={bloqueado ? 'true' : undefined}
            onClick={confirmarCierre}
          >
            Sí, cerrar solicitud
          </button>
        </div>
      </Modal>
    </div>
  );
}
