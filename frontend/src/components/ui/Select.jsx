import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';
import './ui.css';

const ALTO_MAXIMO_LISTA = 256;
const ESPERA_BUSQUEDA_MS = 600;

const textoDe = (hijos) =>
  Children.toArray(hijos)
    .map((hijo) => (typeof hijo === 'string' || typeof hijo === 'number' ? String(hijo) : ''))
    .join('');

// Los `<option>` hijos son la fuente de las opciones: así un `<select>` nativo se reemplaza
// cambiando solo el nombre del componente.
function leerOpciones(hijos) {
  return Children.toArray(hijos)
    .filter((hijo) => isValidElement(hijo) && hijo.type === 'option')
    .map((hijo) => {
      const etiqueta = textoDe(hijo.props.children);
      return {
        valor: String(hijo.props.value ?? etiqueta),
        etiqueta,
        deshabilitada: Boolean(hijo.props.disabled),
      };
    });
}

/**
 * Select personalizado accesible (UX §2.4, patrón "select-only combobox" de WAI-ARIA).
 *
 * - Opciones: `<option value="x">Etiqueta</option>` como hijos, igual que un `<select>`.
 * - `onChange` recibe `{ target: { name, value } }` (también como `currentTarget`), de modo que los
 *   manejadores escritos para `<select>` siguen funcionando.
 * - Teclado: flechas, Inicio/Fin, Enter o Espacio para elegir, Esc para cerrar y escritura para
 *   saltar a una opción. El foco nunca sale del botón (`aria-activedescendant`).
 * - La lista se dibuja en un portal con posición fija: no la recorta un modal con scroll y se abre
 *   hacia arriba si abajo no cabe.
 * - `id`, `aria-invalid` y `aria-describedby` van al botón, para que `<label htmlFor>` lo etiquete.
 */
export default function Select({
  id,
  name,
  value = '',
  onChange,
  disabled = false,
  className = '',
  children,
  ref: refExterno,
  ...aria
}) {
  const listaId = useId();
  const botonRef = useRef(null);
  // `ref` externo (p. ej. para enfocar el campo con error) apunta al mismo botón que usa el componente.
  const asignarRef = (nodo) => {
    botonRef.current = nodo;
    if (typeof refExterno === 'function') refExterno(nodo);
    else if (refExterno) refExterno.current = nodo;
  };
  const listaRef = useRef(null);
  const busquedaRef = useRef({ texto: '', temporizador: null });
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const [posicion, setPosicion] = useState(null);

  const opciones = leerOpciones(children);
  const indiceElegido = opciones.findIndex((o) => o.valor === String(value));
  const elegida = indiceElegido >= 0 ? opciones[indiceElegido] : null;
  const esPlaceholder = !elegida || elegida.valor === '';

  const habilitada = (i) => i >= 0 && i < opciones.length && !opciones[i].deshabilitada;
  const siguiente = (desde, paso) => {
    for (let i = desde + paso; i >= 0 && i < opciones.length; i += paso) {
      if (habilitada(i)) return i;
    }
    return desde;
  };

  function abrir() {
    if (disabled) return;
    setActivo(habilitada(indiceElegido) ? indiceElegido : siguiente(-1, 1));
    setAbierto(true);
  }

  function cerrar() {
    setAbierto(false);
  }

  function elegir(indice) {
    if (!habilitada(indice)) return;
    const { valor } = opciones[indice];
    const objetivo = { name, value: valor };
    onChange?.({ target: objetivo, currentTarget: objetivo });
    cerrar();
    botonRef.current?.focus();
  }

  // Posición fija bajo el botón (o sobre él si abajo no cabe); se recalcula al hacer scroll o redimensionar.
  useLayoutEffect(() => {
    if (!abierto) return undefined;
    function calcular() {
      const caja = botonRef.current?.getBoundingClientRect();
      if (!caja) return;
      const espacioAbajo = window.innerHeight - caja.bottom;
      const arriba =
        espacioAbajo < Math.min(ALTO_MAXIMO_LISTA, opciones.length * 40 + 8) + 8 &&
        caja.top > espacioAbajo;
      setPosicion({
        left: caja.left,
        minWidth: caja.width,
        // No se sale por la derecha de la ventana: si no cabe, el texto de las opciones se ajusta.
        maxWidth: Math.max(caja.width, window.innerWidth - caja.left - 8),
        ...(arriba
          ? {
              bottom: window.innerHeight - caja.top + 4,
              maxHeight: Math.min(ALTO_MAXIMO_LISTA, caja.top - 12),
            }
          : { top: caja.bottom + 4, maxHeight: Math.min(ALTO_MAXIMO_LISTA, espacioAbajo - 12) }),
      });
    }
    calcular();
    window.addEventListener('resize', calcular);
    window.addEventListener('scroll', calcular, true);
    return () => {
      window.removeEventListener('resize', calcular);
      window.removeEventListener('scroll', calcular, true);
    };
  }, [abierto, opciones.length]);

  // Cierra con un clic fuera del botón y de la lista.
  useEffect(() => {
    if (!abierto) return undefined;
    function alSenalar(evento) {
      if (botonRef.current?.contains(evento.target) || listaRef.current?.contains(evento.target))
        return;
      cerrar();
    }
    document.addEventListener('mousedown', alSenalar);
    return () => document.removeEventListener('mousedown', alSenalar);
  }, [abierto]);

  // Mantiene visible la opción activa al navegar con el teclado.
  useEffect(() => {
    if (!abierto || activo < 0) return;
    document.getElementById(`${listaId}-${activo}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [abierto, activo, listaId]);

  useEffect(() => () => clearTimeout(busquedaRef.current.temporizador), []);

  function buscar(letra) {
    const estado = busquedaRef.current;
    clearTimeout(estado.temporizador);
    estado.texto += letra.toLowerCase();
    estado.temporizador = setTimeout(() => {
      estado.texto = '';
    }, ESPERA_BUSQUEDA_MS);
    const empiezaPor = (o, i) => habilitada(i) && o.etiqueta.toLowerCase().startsWith(estado.texto);
    const desde = abierto ? activo : indiceElegido;
    const orden = [...opciones.keys()].map((_, k) => (desde + 1 + k) % opciones.length);
    const hallada = orden.find((i) => empiezaPor(opciones[i], i));
    if (hallada === undefined) return;
    if (abierto) setActivo(hallada);
    else elegir(hallada);
  }

  function alPulsarTecla(evento) {
    if (disabled) return;
    const { key } = evento;
    if (!abierto) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(key)) {
        evento.preventDefault();
        abrir();
      } else if (key.length === 1 && !evento.ctrlKey && !evento.metaKey && !evento.altKey) {
        buscar(key);
      }
      return;
    }
    switch (key) {
      case 'ArrowDown':
        evento.preventDefault();
        setActivo((a) => siguiente(a, 1));
        break;
      case 'ArrowUp':
        evento.preventDefault();
        setActivo((a) => siguiente(a, -1));
        break;
      case 'Home':
        evento.preventDefault();
        setActivo(siguiente(-1, 1));
        break;
      case 'End':
        evento.preventDefault();
        setActivo(siguiente(opciones.length, -1));
        break;
      case 'Enter':
      case ' ':
        evento.preventDefault();
        elegir(activo);
        break;
      case 'Escape':
        // El modal que contenga el select también escucha Esc: aquí solo se cierra la lista.
        evento.preventDefault();
        evento.stopPropagation();
        evento.nativeEvent.stopImmediatePropagation?.();
        cerrar();
        break;
      case 'Tab':
        cerrar();
        break;
      default:
        if (key.length === 1 && !evento.ctrlKey && !evento.metaKey && !evento.altKey) buscar(key);
    }
  }

  return (
    <>
      <button
        ref={asignarRef}
        type="button"
        id={id}
        name={name}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={abierto ? listaId : undefined}
        aria-activedescendant={abierto && activo >= 0 ? `${listaId}-${activo}` : undefined}
        className={`ui-select ${className}`.trim()}
        data-valor={String(value)}
        disabled={disabled}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={alPulsarTecla}
        {...aria}
      >
        <span
          className={
            esPlaceholder ? 'ui-select__valor ui-select__valor--vacio' : 'ui-select__valor'
          }
        >
          {elegida ? elegida.etiqueta : ''}
        </span>
        <Icon nombre="chevron" tamano={18} className="ui-select__flecha" />
      </button>
      {abierto &&
        posicion &&
        createPortal(
          <ul
            ref={listaRef}
            id={listaId}
            role="listbox"
            className="ui-select__lista"
            style={posicion}
            onMouseDown={(evento) => evento.preventDefault()}
          >
            {opciones.map((opcion, i) => (
              <li
                key={opcion.valor}
                id={`${listaId}-${i}`}
                role="option"
                aria-selected={i === indiceElegido}
                aria-disabled={opcion.deshabilitada || undefined}
                data-valor={opcion.valor}
                className={[
                  'ui-select__opcion',
                  i === activo ? 'ui-select__opcion--activa' : '',
                  i === indiceElegido ? 'ui-select__opcion--elegida' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => habilitada(i) && setActivo(i)}
                onClick={() => elegir(i)}
              >
                <span>{opcion.etiqueta}</span>
                {i === indiceElegido && <Icon nombre="tick" tamano={16} />}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}
