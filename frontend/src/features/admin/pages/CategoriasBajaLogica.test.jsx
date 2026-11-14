import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiClient } from '../../../services/apiClient.js';
import { reiniciarAreas } from '../../../test/handlers/admin.areas.js';
import { reiniciarCategorias } from '../../../test/handlers/admin.categorias.js';
import MisSolicitudesPage from '../../solicitudes/pages/MisSolicitudesPage.jsx';
import NuevaSolicitudPage from '../../solicitudes/pages/NuevaSolicitudPage.jsx';
import CategoriasPage from './CategoriasPage.jsx';
import { esperarOpcion, seleccionar, opcionesDe } from '../../../test/seleccionar.js';

// ADM-21 (TC-026, RN-14): la baja lógica de una categoría la oculta del formulario de solicitud
// pero no toca las solicitudes que ya la usan. Se prueba de extremo a extremo en el frontend:
// la pantalla de administración y las del solicitante comparten los handlers MSW con estado.

beforeEach(() => {
  reiniciarAreas();
  reiniciarCategorias();
  sessionStorage.clear(); // el borrador del formulario vive en sessionStorage
});

const renderFormulario = () =>
  render(
    <MemoryRouter initialEntries={['/solicitudes/nueva']}>
      <Routes>
        <Route path="/solicitudes/nueva" element={<NuevaSolicitudPage />} />
      </Routes>
    </MemoryRouter>,
  );

// Espera a que el catálogo cargue (una categoría que nunca se desactiva en estas pruebas) y
// recién entonces lee las opciones: sin esa guarda, un `not.toContain` pasaría con el selector
// aún vacío.
const opcionesCategoria = async () => {
  await esperarOpcion(screen.getByLabelText('Categoría'), 'Equipos de Cómputo');
  return opcionesDe(screen.getByLabelText('Categoría')).map((opcion) => opcion.etiqueta);
};

async function desactivarComoAdmin(nombre) {
  const admin = render(<CategoriasPage />);
  await userEvent.click(await screen.findByRole('button', { name: `Desactivar ${nombre}` }));
  await userEvent.click(
    within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Desactivar' }),
  );
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('desactivada'));
  admin.unmount();
}

describe('Baja lógica de categoría (TC-026)', () => {
  it('[TC-026] una categoría desactivada desaparece del formulario de nueva solicitud', async () => {
    const antes = renderFormulario();
    expect(await opcionesCategoria()).toContain('Mobiliario');
    antes.unmount();

    await desactivarComoAdmin('Mobiliario');
    renderFormulario();

    const opciones = await opcionesCategoria();
    expect(opciones).toContain('Equipos de Cómputo');
    expect(opciones).not.toContain('Mobiliario');
  });

  it('[TC-026] al reactivarla vuelve a ofrecerse en el formulario', async () => {
    await desactivarComoAdmin('Mobiliario');
    const sinMobiliario = renderFormulario();
    expect(await opcionesCategoria()).not.toContain('Mobiliario'); // la baja sí tuvo efecto
    sinMobiliario.unmount();

    const admin = render(<CategoriasPage />);
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Mostrar inactivas' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Reactivar Mobiliario' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('reactivada'));
    admin.unmount();

    renderFormulario();

    expect(await opcionesCategoria()).toContain('Mobiliario');
  });

  it('[TC-026] las solicitudes existentes conservan su categoría y siguen en el historial', async () => {
    await desactivarComoAdmin('Equipos de Cómputo');
    await desactivarComoAdmin('Mobiliario');

    // Capa de datos: el handler resuelve `categoriaNombre` desde las categorías (como el JOIN del
    // backend), así que la prueba falla si la baja las borra o renombra en lugar de `activo=false`.
    const historial = await apiClient.get('/solicitudes/mis-solicitudes?page=0&size=20');
    expect(historial.content).toHaveLength(20);
    expect(new Set(historial.content.map((s) => s.categoriaNombre))).toEqual(
      new Set(['Equipos de Cómputo', 'Mobiliario']),
    );

    // Pantalla: «Mis solicitudes» sigue listando todas (no filtra por categorías activas).
    render(
      <MemoryRouter initialEntries={['/mis-solicitudes']}>
        <Routes>
          <Route path="/mis-solicitudes" element={<MisSolicitudesPage />} />
        </Routes>
      </MemoryRouter>,
    );
    const tabla = await screen.findByRole('table', { name: 'Mis solicitudes' });
    expect(within(tabla).getAllByRole('row')).toHaveLength(21); // cabecera + 20
  });

  it('[TC-026] el administrador sigue viendo la categoría inactiva con "Mostrar inactivas"', async () => {
    await desactivarComoAdmin('Mobiliario');
    render(<CategoriasPage />);

    await waitFor(() => expect(screen.queryByRole('row', { name: /Mobiliario/ })).toBeNull());
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Mostrar inactivas' }));

    expect(await screen.findByRole('row', { name: /Mobiliario/ })).toBeVisible();
  });

  it('[UAT-09] una categoría nueva aparece en el formulario y desaparece al desactivarla', async () => {
    const admin = render(<CategoriasPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Nueva categoría' }));
    const dialogo = within(screen.getByRole('dialog', { name: 'Nueva categoría' }));
    await esperarOpcion(dialogo.getByLabelText('Área responsable'), 'Infraestructura');
    await userEvent.type(dialogo.getByLabelText('Nombre'), 'Pizarras Interactivas');
    await seleccionar(userEvent, dialogo.getByLabelText('Área responsable'), '2');
    await userEvent.type(dialogo.getByLabelText('SLA estándar (horas)'), '36');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('creada'));
    admin.unmount();

    const conNueva = renderFormulario();
    expect(await opcionesCategoria()).toContain('Pizarras Interactivas');
    conNueva.unmount();

    await desactivarComoAdmin('Pizarras Interactivas');
    renderFormulario();
    expect(await opcionesCategoria()).not.toContain('Pizarras Interactivas');
  }, 20000);
});
