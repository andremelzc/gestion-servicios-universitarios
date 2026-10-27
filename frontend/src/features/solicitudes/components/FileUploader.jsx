// Componente de evidencias (REG-16 · US-06; aceptación FileUploader.test / CA-4).
// - Drag & drop + selector; límites 5 MB por archivo y máximo 3 (REG-10).
// - Vista previa de imágenes con `URL.createObjectURL`, liberada al quitar el archivo
//   y al desmontar (specs/02-registro-solicitudes/02-plan.md §4).
// - Errores por archivo con `role="alert"` (aria-live) y mensajes de UX §9.
// - `error` (opcional): mensaje del campo (p. ej. "falta evidencia") asociado a la entrada.
// - Controlado: el formulario es dueño de `archivos` y deshabilita su envío con
//   `validarArchivos(archivos)` (CA-4); el límite de 3 se aplica al seleccionar.
import { useEffect, useRef, useState } from 'react';
import {
  MAX_ARCHIVOS,
  MSG_MAXIMO_ARCHIVOS,
  esImagen,
  formatearTamano,
  validarArchivo,
} from '../evidencias.js';
import './FileUploader.css';

const ACEPTADOS = '.jpg,.jpeg,.png,.pdf';

// Identidad de la miniatura: mismo nombre, tamaño y fecha => mismo contenido esperado.
const claveDe = (archivo) => `${archivo.name}-${archivo.size}-${archivo.lastModified}`;

// Solo se renderizan object URLs creados por el navegador para las miniaturas.
const esUrlMiniatura = (url) => typeof url === 'string' && url.startsWith('blob:');

function etiquetaTipo(nombre) {
  const punto = nombre.lastIndexOf('.');
  return punto === -1 ? 'ARCHIVO' : nombre.slice(punto + 1).toUpperCase();
}

export default function FileUploader({
  archivos = [],
  onChange,
  maxArchivos = MAX_ARCHIVOS,
  deshabilitado = false,
  id = 'evidencias',
  etiqueta = 'Evidencias (opcional)',
  error = null,
}) {
  const [arrastrando, setArrastrando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [miniaturas, setMiniaturas] = useState({}); // clave del archivo → object URL
  const miniaturasVigentes = useRef({}); // espejo para liberarlas al desmontar

  // Sincroniza las miniaturas con la lista de archivos: crea las de las imágenes
  // nuevas y revoca las de las que salen. Excepción legítima a `set-state-in-effect`:
  // los object URL viven fuera de React (fuente externa, como la sesión en AuthContext).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const siguientes = {};
    let huboCambios = false;
    for (const archivo of archivos) {
      if (!esImagen(archivo)) continue;
      const clave = claveDe(archivo);
      const existente = siguientes[clave] ?? miniaturas[clave];
      if (existente) {
        siguientes[clave] = existente;
      } else {
        siguientes[clave] = URL.createObjectURL(archivo);
        huboCambios = true;
      }
    }
    for (const [clave, url] of Object.entries(miniaturas)) {
      if (!(clave in siguientes)) {
        URL.revokeObjectURL(url);
        huboCambios = true;
      }
    }
    miniaturasVigentes.current = siguientes;
    if (huboCambios) setMiniaturas(siguientes);
  }, [archivos, miniaturas]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Al desmontar, libera todas las miniaturas vigentes.
  useEffect(() => {
    const espejo = miniaturasVigentes;
    return () => {
      for (const url of Object.values(espejo.current)) URL.revokeObjectURL(url);
    };
  }, []);

  function agregar(seleccionados) {
    if (seleccionados.length === 0) return;
    const espacio = Math.max(maxArchivos - archivos.length, 0);
    const aceptados = seleccionados.slice(0, espacio);
    setAviso(aceptados.length < seleccionados.length ? MSG_MAXIMO_ARCHIVOS : null);
    if (aceptados.length > 0) onChange([...archivos, ...aceptados]);
  }

  function alSeleccionar(evento) {
    const seleccionados = Array.from(evento.target.files ?? []);
    evento.target.value = ''; // permite volver a elegir el mismo archivo
    agregar(seleccionados);
  }

  function alSoltar(evento) {
    evento.preventDefault();
    setArrastrando(false);
    agregar(Array.from(evento.dataTransfer?.files ?? []));
  }

  function quitar(archivo) {
    setAviso(null);
    onChange(archivos.filter((adjunto) => adjunto !== archivo));
  }

  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;

  return (
    <div className="file-uploader">
      <p className="file-uploader__etiqueta" id={`${id}-etiqueta`}>
        {etiqueta}
      </p>

      <label
        className="file-uploader__zona"
        data-arrastrando={arrastrando}
        onDragOver={(evento) => {
          evento.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={(evento) => {
          if (!evento.currentTarget.contains(evento.relatedTarget)) setArrastrando(false);
        }}
        onDrop={alSoltar}
      >
        <input
          id={id}
          className="sr-only"
          type="file"
          multiple
          accept={ACEPTADOS}
          disabled={deshabilitado}
          onChange={alSeleccionar}
          aria-labelledby={`${id}-etiqueta`}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${idAyuda} ${idError}` : idAyuda}
        />
        <span className="file-uploader__instruccion">Arrastra o toca para subir</span>
        <span className="file-uploader__ayuda" id={idAyuda}>
          JPG · PNG · PDF · máx. {maxArchivos} archivos · 5 MB c/u
        </span>
      </label>

      {error && (
        <p className="file-uploader__aviso" id={idError}>
          {error}
        </p>
      )}

      {aviso && (
        <p className="file-uploader__aviso" role="alert">
          {aviso}
        </p>
      )}

      {archivos.length > 0 && (
        <ul className="file-uploader__lista" aria-label="Evidencias adjuntas">
          {archivos.map((archivo, indice) => {
            const error = validarArchivo(archivo);
            const clave = claveDe(archivo);
            const url = miniaturas[clave];
            return (
              <li
                key={`${clave}-${indice}`}
                className="file-uploader__archivo"
                data-error={Boolean(error)}
              >
                {esUrlMiniatura(url) ? (
                  <img className="file-uploader__miniatura" src={url} alt="" /> // codeql[js/xss-through-dom] URL.createObjectURL genera un blob: URL, no HTML del usuario.
                ) : (
                  <span className="file-uploader__tipo" aria-hidden="true">
                    {etiquetaTipo(archivo.name)}
                  </span>
                )}
                <span className="file-uploader__nombre">{archivo.name}</span>
                <span className="file-uploader__tamano">{formatearTamano(archivo.size)}</span>
                <button
                  type="button"
                  className="file-uploader__quitar"
                  onClick={() => quitar(archivo)}
                  aria-label={`Quitar ${archivo.name}`}
                >
                  ✕
                </button>
                {error && (
                  <p className="file-uploader__error" id={`${id}-error-${indice}`} role="alert">
                    {error}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
