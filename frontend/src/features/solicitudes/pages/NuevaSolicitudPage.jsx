// Formulario de nueva solicitud (REG-15 · US-05/US-06; CA-1…CA-4, UAT-02).
// - Validación Zod con los esquemas de `../schemas.js` y contador 15/500 (UX §9, W-03).
// - Categorías y prioridades activas desde `GET /categorias` y `/prioridades` (API §3.5):
//   estados cargando/error con reintento (plan §2).
// - Borrador en `sessionStorage`: se guarda al escribir, se restaura al volver y se limpia
//   al enviar (plan §2). «Cancelar» lo conserva a propósito; los archivos no caben en él.
// - Envío multipart: parte `solicitud` (Blob JSON `application/json`) + partes `archivos`
//   (API §3.2). Tras el 201 navega a la confirmación con el código (REG-17).
// - CA-4: con evidencias inválidas (tamaño/tipo) el envío queda deshabilitado.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { etiquetaPrioridad } from '../../../components/ui/catalogos.js';
import { apiClient } from '../../../services/apiClient.js';
import { interpretarError } from '../../../services/errores.js';
import FileUploader from '../components/FileUploader.jsx';
import { validarArchivos } from '../evidencias.js';
import {
  DESCRIPCION_MAX,
  DESCRIPCION_MIN,
  NuevaSolicitudSchema,
  TITULO_MAX,
  UBICACION_MAX,
} from '../schemas.js';
import './NuevaSolicitudPage.css';

/** Clave del borrador en `sessionStorage` (se limpia al enviar con éxito). */
export const CLAVE_BORRADOR = 'gestion_univ_borrador_solicitud';

// Orden visual del formulario: primer campo con error para el foco (CA-3).
const CAMPOS = [
  'titulo',
  'idCategoria',
  'idPrioridad',
  'ubicacionCampus',
  'ubicacionAmbiente',
  'descripcion',
];

const VALORES_INICIALES = {
  titulo: '',
  idCategoria: '',
  idPrioridad: '',
  ubicacionCampus: '',
  ubicacionAmbiente: '',
  descripcion: '',
};

function aErroresPorCampo(errorZod) {
  const errores = {};
  for (const problema of errorZod.issues) {
    const campo = problema.path[0];
    if (campo && !errores[campo]) errores[campo] = problema.message;
  }
  return errores;
}

// Borrador tolerante: solo campos conocidos y de tipo texto; un borrador corrupto se ignora.
function leerBorrador() {
  try {
    const datos = JSON.parse(sessionStorage.getItem(CLAVE_BORRADOR));
    const borrador = { ...VALORES_INICIALES };
    for (const campo of CAMPOS) {
      if (typeof datos?.[campo] === 'string') borrador[campo] = datos[campo];
    }
    return borrador;
  } catch {
    return VALORES_INICIALES;
  }
}

// `sessionStorage` puede no estar disponible (modo privado): el formulario sigue funcionando.
function guardarBorrador(valores) {
  try {
    if (CAMPOS.every((campo) => valores[campo] === '')) {
      sessionStorage.removeItem(CLAVE_BORRADOR);
    } else {
      sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(valores));
    }
  } catch {
    /* sin persistencia */
  }
}

function limpiarBorrador() {
  try {
    sessionStorage.removeItem(CLAVE_BORRADOR);
  } catch {
    /* sin persistencia */
  }
}

export default function NuevaSolicitudPage() {
  const navigate = useNavigate();
  const [valores, setValores] = useState(leerBorrador);
  const [archivos, setArchivos] = useState([]);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [catalogos, setCatalogos] = useState({
    cargando: true,
    error: null,
    categorias: [],
    prioridades: [],
  });
  const [intentoCatalogos, setIntentoCatalogos] = useState(0);

  useEffect(() => {
    let vigente = true;
    Promise.all([apiClient.get('/categorias'), apiClient.get('/prioridades')])
      .then(([categorias, prioridades]) => {
        if (vigente) setCatalogos({ cargando: false, error: null, categorias, prioridades });
      })
      .catch((fallo) => {
        if (vigente) setCatalogos((previos) => ({ ...previos, cargando: false, error: fallo }));
      });
    return () => {
      vigente = false;
    };
  }, [intentoCatalogos]);

  useEffect(() => {
    guardarBorrador(valores);
  }, [valores]);

  const erroresArchivos = validarArchivos(archivos);
  const puedeEnviar = !enviando && erroresArchivos.length === 0;
  const avisoCatalogos = catalogos.error ? interpretarError(catalogos.error).general : null;

  function reintentarCatalogos() {
    setCatalogos((previos) => ({ ...previos, cargando: true, error: null }));
    setIntentoCatalogos((n) => n + 1);
  }

  function alCambiarCampo(campo) {
    return (evento) => {
      const valor = evento.target.value;
      setValores((previos) => ({ ...previos, [campo]: valor }));
      setErrores((previos) => ({ ...previos, [campo]: undefined }));
      setErrorGeneral(null);
    };
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setErrorGeneral(null);

    const resultado = NuevaSolicitudSchema.safeParse(valores);
    if (!resultado.success) {
      const nuevosErrores = aErroresPorCampo(resultado.error);
      setErrores(nuevosErrores);
      const primerCampo = CAMPOS.find((campo) => nuevosErrores[campo]);
      evento.target.elements[primerCampo]?.focus();
      return;
    }

    setErrores({});
    setEnviando(true);
    try {
      const cuerpo = new FormData();
      cuerpo.append(
        'solicitud',
        new Blob([JSON.stringify(resultado.data)], { type: 'application/json' }),
      );
      for (const archivo of archivos) cuerpo.append('archivos', archivo);

      const creada = await apiClient.post('/solicitudes', cuerpo);
      limpiarBorrador();
      navigate('/solicitudes/confirmacion', {
        replace: true,
        state: { id: creada.id, codigo: creada.codigo },
      });
    } catch (fallo) {
      const { general, campos } = interpretarError(fallo, CAMPOS);
      setErrores(campos);
      setErrorGeneral(general);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="nueva-solicitud">
      <h1 className="nueva-solicitud__titulo">Nueva solicitud</h1>

      {errorGeneral && (
        <div className="nueva-solicitud__alerta" role="alert">
          {errorGeneral}
        </div>
      )}

      {avisoCatalogos && (
        <div className="nueva-solicitud__alerta" role="alert">
          <p className="nueva-solicitud__alerta-texto">{avisoCatalogos}</p>
          <button
            type="button"
            className="nueva-solicitud__reintentar"
            onClick={reintentarCatalogos}
          >
            Reintentar
          </button>
        </div>
      )}

      <form className="nueva-solicitud__form" noValidate onSubmit={alEnviar}>
        <div className="nueva-solicitud__columna">
          <div className="nueva-solicitud__campo">
            <label htmlFor="titulo">Título</label>
            <input
              id="titulo"
              name="titulo"
              type="text"
              maxLength={TITULO_MAX}
              placeholder="Proyector sin imagen"
              value={valores.titulo}
              onChange={alCambiarCampo('titulo')}
              aria-invalid={Boolean(errores.titulo)}
              aria-describedby={errores.titulo ? 'error-titulo' : undefined}
            />
            {errores.titulo && (
              <p className="nueva-solicitud__error" id="error-titulo" role="alert">
                {errores.titulo}
              </p>
            )}
          </div>

          <div className="nueva-solicitud__fila">
            <div className="nueva-solicitud__campo">
              <label htmlFor="idCategoria">Categoría</label>
              <select
                id="idCategoria"
                name="idCategoria"
                value={valores.idCategoria}
                disabled={catalogos.cargando}
                onChange={alCambiarCampo('idCategoria')}
                aria-invalid={Boolean(errores.idCategoria)}
                aria-describedby={errores.idCategoria ? 'error-idCategoria' : undefined}
              >
                <option value="">
                  {catalogos.cargando ? 'Cargando…' : 'Selecciona una categoría'}
                </option>
                {catalogos.categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
              {errores.idCategoria && (
                <p className="nueva-solicitud__error" id="error-idCategoria" role="alert">
                  {errores.idCategoria}
                </p>
              )}
            </div>

            <div className="nueva-solicitud__campo">
              <label htmlFor="idPrioridad">Prioridad</label>
              <select
                id="idPrioridad"
                name="idPrioridad"
                value={valores.idPrioridad}
                disabled={catalogos.cargando}
                onChange={alCambiarCampo('idPrioridad')}
                aria-invalid={Boolean(errores.idPrioridad)}
                aria-describedby={errores.idPrioridad ? 'error-idPrioridad' : undefined}
              >
                <option value="">
                  {catalogos.cargando ? 'Cargando…' : 'Selecciona una prioridad'}
                </option>
                {catalogos.prioridades.map((prioridad) => (
                  <option key={prioridad.id} value={prioridad.id}>
                    {etiquetaPrioridad(prioridad.nivel)}
                  </option>
                ))}
              </select>
              {errores.idPrioridad && (
                <p className="nueva-solicitud__error" id="error-idPrioridad" role="alert">
                  {errores.idPrioridad}
                </p>
              )}
            </div>
          </div>

          <div className="nueva-solicitud__campo">
            <label htmlFor="ubicacionCampus">Campus</label>
            <input
              id="ubicacionCampus"
              name="ubicacionCampus"
              type="text"
              maxLength={UBICACION_MAX}
              placeholder="Campus Central"
              value={valores.ubicacionCampus}
              onChange={alCambiarCampo('ubicacionCampus')}
              aria-invalid={Boolean(errores.ubicacionCampus)}
              aria-describedby={errores.ubicacionCampus ? 'error-ubicacionCampus' : undefined}
            />
            {errores.ubicacionCampus && (
              <p className="nueva-solicitud__error" id="error-ubicacionCampus" role="alert">
                {errores.ubicacionCampus}
              </p>
            )}
          </div>

          <div className="nueva-solicitud__campo">
            <label htmlFor="ubicacionAmbiente">Ubicación (aula/laboratorio)</label>
            <input
              id="ubicacionAmbiente"
              name="ubicacionAmbiente"
              type="text"
              maxLength={UBICACION_MAX}
              placeholder="Pabellón B - Aula 402"
              value={valores.ubicacionAmbiente}
              onChange={alCambiarCampo('ubicacionAmbiente')}
              aria-invalid={Boolean(errores.ubicacionAmbiente)}
              aria-describedby={errores.ubicacionAmbiente ? 'error-ubicacionAmbiente' : undefined}
            />
            {errores.ubicacionAmbiente && (
              <p className="nueva-solicitud__error" id="error-ubicacionAmbiente" role="alert">
                {errores.ubicacionAmbiente}
              </p>
            )}
          </div>
        </div>

        <div className="nueva-solicitud__columna">
          <div className="nueva-solicitud__campo">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={6}
              maxLength={DESCRIPCION_MAX}
              value={valores.descripcion}
              onChange={alCambiarCampo('descripcion')}
              aria-invalid={Boolean(errores.descripcion)}
              aria-describedby={[
                'contador-descripcion',
                errores.descripcion ? 'error-descripcion' : null,
              ]
                .filter(Boolean)
                .join(' ')}
            />
            <p className="nueva-solicitud__contador" id="contador-descripcion">
              {valores.descripcion.length} / {DESCRIPCION_MAX} · mín. {DESCRIPCION_MIN}
            </p>
            {errores.descripcion && (
              <p className="nueva-solicitud__error" id="error-descripcion" role="alert">
                {errores.descripcion}
              </p>
            )}
          </div>

          <FileUploader archivos={archivos} onChange={setArchivos} />
        </div>

        <div className="nueva-solicitud__acciones">
          <Link className="nueva-solicitud__cancelar" to="/mis-solicitudes">
            Cancelar
          </Link>
          <button type="submit" className="nueva-solicitud__enviar" disabled={!puedeEnviar}>
            {enviando ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </form>
    </main>
  );
}
