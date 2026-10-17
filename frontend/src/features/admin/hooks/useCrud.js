import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '../../../services/apiClient.js';

// Hook genérico del CRUD de administración (arquitectura §4.2, ADM-12). Lista paginada
// (api-rest §2.3: sobre `{content, page, size, totalElements, totalPages}`, página base 0),
// búsqueda con *debounce* y filtro de inactivos. Los nombres que devuelve coinciden con las
// props de `components/ui/DataTable`, para pasarlos tal cual (ver el ejemplo de ese archivo).
//
// Opciones
// - `size` (20), `debounceMs` (300), `paramBusqueda` ('q').
// - `paramInactivos`: nombre del parámetro booleano que se envía en `true` ('incluirInactivos',
//   api-rest §3.5), o una función `(includeInactive) => ({param: valor} | {})` para mapear el
//   filtro. `/admin/usuarios` (§3.6) no tiene `incluirInactivos` sino `activo`; como la API no fija
//   su valor por defecto, se asume que sin `activo` devuelve todos:
//   `paramInactivos: (incluir) => (incluir ? {} : { activo: true })`.
// - `ruta` puede traer ya una consulta (`?a=b`): los parámetros se añaden con `&`.
// - Respuesta: el sobre de §2.3 o, para catálogos (§3.5 no lo precisa), un arreglo simple, que se
//   normaliza a una única página.
// - `filtros`: parámetros propios de la pantalla (p. ej. `{ idArea }`); se omiten los vacíos. Un
//   cambio de su contenido vuelve a la página 0; cambiar `ruta` reinicia todo.
//
// Diseño: el listado es un derivado de la URL de la consulta. El estado solo se escribe desde
// manejadores de eventos, durante el render (reinicios por cambio de `ruta`/`filtros`, patrón
// "estado previo") o desde el resultado asíncrono de la petición; nunca de forma síncrona en un
// efecto (`react-hooks/set-state-in-effect`). Una respuesta de una consulta reemplazada se
// descarta (`AbortController` y bandera `aborted`).
// - `isLoading`: la consulta pedida no es la respondida (o se reintenta tras un error): esqueleto.
// - `isRefreshing`: se repite la misma consulta (`refetch`); los datos siguen visibles.

const TAMANO_PAGINA = 20;
const ESPERA_BUSQUEDA_MS = 300;
const CONSULTA_INICIAL = { page: 0, search: '', includeInactive: false };
const SIN_RESULTADO = { url: null, clave: null, data: [], page: null, error: null };

const tieneValor = (valor) => valor !== undefined && valor !== null && valor !== '';

// api-rest §3.5 no dice que los catálogos devuelvan el sobre de §2.3: un arreglo simple se
// trata como una única página.
function normalizarSobre(respuesta) {
  if (!Array.isArray(respuesta)) return respuesta;
  return {
    content: respuesta,
    page: 0,
    size: respuesta.length,
    totalElements: respuesta.length,
    totalPages: respuesta.length ? 1 : 0,
  };
}

function parametrosInactivos(paramInactivos, includeInactive) {
  if (typeof paramInactivos === 'function') return paramInactivos(includeInactive);
  return includeInactive ? { [paramInactivos]: true } : {};
}

function construirUrl(ruta, consulta, { size, paramBusqueda, paramInactivos, filtros }) {
  const params = new URLSearchParams({ page: String(consulta.page), size: String(size) });
  if (consulta.search) params.set(paramBusqueda, consulta.search);
  const extras = {
    ...parametrosInactivos(paramInactivos, consulta.includeInactive),
    ...filtros,
  };
  for (const [clave, valor] of Object.entries(extras)) {
    if (tieneValor(valor)) params.set(clave, String(valor));
  }
  return `${ruta}${ruta.includes('?') ? '&' : '?'}${params}`;
}

export default function useCrud(ruta, opciones = {}) {
  const {
    size = TAMANO_PAGINA,
    debounceMs = ESPERA_BUSQUEDA_MS,
    paramBusqueda = 'q',
    paramInactivos = 'incluirInactivos',
    filtros = {},
  } = opciones;

  const [consulta, setConsulta] = useState({ ...CONSULTA_INICIAL, version: 0 });
  // Texto tal como se escribe; `consulta.search` es la búsqueda ya aplicada (tras el debounce).
  const [busquedaEnVivo, setBusquedaEnVivo] = useState('');
  const [resultado, setResultado] = useState(SIN_RESULTADO);

  const temporizador = useRef(null);

  // Contenido de los filtros, para comparar por valor y no por identidad del objeto.
  const filtrosClave = JSON.stringify(
    Object.entries(filtros)
      .filter(([, valor]) => tieneValor(valor))
      .sort(([a], [b]) => a.localeCompare(b)),
  );

  // Reinicios durante el render (permitidos por React, sin efecto): `ruta` reinicia todo y un
  // cambio de `filtros` vuelve a la página 0.
  const [origen, setOrigen] = useState({ ruta, filtrosClave });
  if (origen.ruta !== ruta) {
    setOrigen({ ruta, filtrosClave });
    setConsulta((actual) => ({ ...CONSULTA_INICIAL, version: actual.version }));
    setBusquedaEnVivo('');
    setResultado(SIN_RESULTADO);
  } else if (origen.filtrosClave !== filtrosClave) {
    setOrigen({ ruta, filtrosClave });
    setConsulta((actual) => ({ ...actual, page: 0 }));
  }

  const url = construirUrl(ruta, consulta, { size, paramBusqueda, paramInactivos, filtros });
  const clave = `${consulta.version}|${url}`;

  useEffect(() => {
    const controlador = new AbortController();
    apiClient
      .get(url, { signal: controlador.signal })
      .then((respuesta) => {
        if (controlador.signal.aborted) return;
        const sobre = normalizarSobre(respuesta);
        const { page, size: tamano, totalElements, totalPages } = sobre;
        const data = sobre.content ?? [];
        // Página vacía tras borrar o filtrar: se retrocede a la última con datos (o a la 0).
        const destino = Math.max(totalPages - 1, 0);
        if (data.length === 0 && page > 0 && destino < page) {
          setConsulta((actual) => (actual.page === page ? { ...actual, page: destino } : actual));
          return;
        }
        setResultado({
          url,
          clave,
          data,
          page: { page, size: tamano, totalElements, totalPages },
          error: null,
        });
      })
      .catch((error) => {
        if (controlador.signal.aborted) return;
        setResultado({ url, clave, data: [], page: null, error });
      });
    return () => controlador.abort();
  }, [url, clave]);

  // Al desmontar o cambiar de `ruta` no debe quedar un debounce pendiente.
  useEffect(() => () => clearTimeout(temporizador.current), [ruta]);

  const refetch = useCallback(
    () => setConsulta((actual) => ({ ...actual, version: actual.version + 1 })),
    [],
  );

  const onPageChange = useCallback((page) => setConsulta((actual) => ({ ...actual, page })), []);

  const onSearchChange = useCallback(
    (valor) => {
      setBusquedaEnVivo(valor);
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => {
        const aplicada = valor.trim();
        // Sin cambio efectivo no se toca el estado: ni página 0 ni nueva petición.
        setConsulta((actual) =>
          actual.search === aplicada ? actual : { ...actual, search: aplicada, page: 0 },
        );
      }, debounceMs);
    },
    [debounceMs],
  );

  const onIncludeInactiveChange = useCallback(
    (includeInactive) => setConsulta((actual) => ({ ...actual, includeInactive, page: 0 })),
    [],
  );

  const otraConsulta = resultado.url !== url;
  const reintento = resultado.error !== null && resultado.clave !== clave;
  const isLoading = otraConsulta || reintento;

  return {
    data: resultado.data,
    page: resultado.page,
    onPageChange,
    search: busquedaEnVivo,
    onSearchChange,
    appliedSearch: consulta.search,
    includeInactive: consulta.includeInactive,
    onIncludeInactiveChange,
    isLoading,
    isRefreshing: !isLoading && resultado.clave !== clave,
    error: isLoading ? null : resultado.error,
    onRetry: refetch,
    refetch,
  };
}
