import { fireEvent, waitFor, within } from '@testing-library/react';

/**
 * Elige una opción de un `Select` personalizado: abre el combobox y hace clic en la opción cuyo
 * `value` (atributo `data-valor`) o texto coincide con `valorOEtiqueta`.
 */
export async function seleccionar(usuario, combobox, valorOEtiqueta) {
  await usuario.click(combobox);
  const lista = document.getElementById(combobox.getAttribute('aria-controls'));
  const opciones = within(lista).getAllByRole('option');
  const objetivo = String(valorOEtiqueta);
  const opcion = opciones.find(
    (o) => o.dataset.valor === objetivo || o.textContent.trim() === objetivo,
  );
  if (!opcion) {
    throw new Error(
      `Sin opción "${objetivo}". Disponibles: ${opciones.map((o) => o.textContent.trim()).join(', ')}`,
    );
  }
  await usuario.click(opcion);
}

/**
 * Lee las opciones de un `Select` (con la lista cerrada no están en el DOM): la abre, las lee y la
 * cierra con Esc. Es síncrona, así que sirve dentro de `waitFor`. Un select deshabilitado no abre
 * y devuelve `[]`.
 */
export function opcionesDe(combobox) {
  fireEvent.click(combobox);
  const lista = document.getElementById(combobox.getAttribute('aria-controls'));
  const opciones = lista ? within(lista).getAllByRole('option') : [];
  const datos = opciones.map((o) => ({
    etiqueta: o.textContent.trim(),
    valor: o.dataset.valor,
    deshabilitada: o.getAttribute('aria-disabled') === 'true',
    elegida: o.getAttribute('aria-selected') === 'true',
  }));
  fireEvent.keyDown(combobox, { key: 'Escape' });
  return datos;
}

/** Espera a que el select tenga una opción con esa etiqueta (p. ej. a que cargue su catálogo). */
export const esperarOpcion = (combobox, etiqueta) =>
  waitFor(() => {
    const etiquetas = opcionesDe(combobox).map((o) => o.etiqueta);
    if (!etiquetas.includes(etiqueta)) throw new Error(`Aún sin la opción "${etiqueta}"`);
  });
