import { useMemo, useState } from 'react';

// Constantes de módulo: referencias estables para el efecto de foco del formulario.
const SIN_CAMPOS = {};
const SIN_ERROR = { general: null, campos: SIN_CAMPOS };

/**
 * Estado de las pantallas de administración sobre `useCrud`: qué diálogo está abierto
 * (`{ tipo: 'crear' | 'editar' | 'desactivar', fila? }`), el aviso de éxito y los errores del
 * servidor. Un 409 puede traer el campo en conflicto (`errores`), que `useCrud` solo expone como
 * aviso general: aquí se separa para mostrarlo junto al campo.
 *
 * `ejecutar(mutacion, mensaje)` corre una mutación de `useCrud`; si sale bien cierra el diálogo y
 * fija el aviso. Las pantallas de prioridades y estados traen esta lógica en línea; aquí se
 * comparte entre categorías y áreas.
 */
export default function useAccionesCrud(crud) {
  const [dialogo, setDialogo] = useState(null);
  const [aviso, setAviso] = useState('');
  const [conflicto, setConflicto] = useState(SIN_CAMPOS);

  const { general: avisoGeneral, campos: camposServidor } = crud.errorMutacion ?? SIN_ERROR;
  const hayConflicto = Object.keys(conflicto).length > 0;
  const general = hayConflicto ? null : avisoGeneral;
  const campos = useMemo(
    () => (hayConflicto ? { ...camposServidor, ...conflicto } : camposServidor),
    [hayConflicto, camposServidor, conflicto],
  );

  const abrir = (siguiente) => {
    crud.limpiarErrorMutacion();
    setConflicto(SIN_CAMPOS);
    setAviso('');
    setDialogo(siguiente);
  };

  const cerrar = () => {
    crud.limpiarErrorMutacion();
    setConflicto(SIN_CAMPOS);
    setDialogo(null);
  };

  async function ejecutar(mutacion, mensaje) {
    setConflicto(SIN_CAMPOS);
    const { ok, error } = await mutacion();
    if (!ok) {
      if (error?.status === 409 && Object.keys(error.errores ?? {}).length > 0) {
        setConflicto(error.errores);
      }
      return;
    }
    setDialogo(null);
    setAviso(mensaje);
  }

  return { dialogo, aviso, general, campos, abrir, cerrar, ejecutar };
}
