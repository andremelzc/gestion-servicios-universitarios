import { renderHook, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiClient } from '../../../services/apiClient.js';
import { reiniciarAreas } from '../../../test/handlers/admin.areas.js';
import { reiniciarCategorias } from '../../../test/handlers/admin.categorias.js';
import { useAreas } from '../../dashboard/hooks/useAreas.js';
import useCatalogosBandeja from '../../gestion/hooks/useCatalogosBandeja.js';
import NuevaSolicitudPage from '../../solicitudes/pages/NuevaSolicitudPage.jsx';
import AreasPage from './AreasPage.jsx';

// ADM-20 (CA-1): un cambio de catálogo hecho por el administrador se ve de inmediato en el
// formulario de solicitud, en el filtro de áreas del dashboard y en los filtros de la bandeja.
//
// Decisión: hoy NO hay caché de catálogos en el frontend. Cada pantalla pide `GET /categorias`,
// `/areas` o `/prioridades` al montarse (`NuevaSolicitudPage`, `useAreas`, `useCatalogosBandeja`)
// y `components/ui/catalogos.js` solo traduce códigos a etiquetas, sin memorizar datos. Por eso
// no hay nada que invalidar: se prueba que el cambio llega a la siguiente pantalla que se monta
// y se evita construir una caché que solo añadiría riesgo de datos viejos.

beforeEach(() => {
  reiniciarAreas();
  reiniciarCategorias();
  localStorage.clear();
});

const categoriaNueva = {
  nombre: 'Pizarras Interactivas',
  descripcion: null,
  idArea: 2,
  tiempoSlaHoras: 36,
};

const nombres = (lista) => lista.map((elemento) => elemento.nombre);

describe('Catálogos al instante tras un cambio del administrador (CA-1)', () => {
  it('[ADM-20 CA-1] una categoría creada aparece en el formulario de solicitud al abrirlo', async () => {
    await apiClient.post('/categorias', categoriaNueva);

    render(
      <MemoryRouter initialEntries={['/solicitudes/nueva']}>
        <Routes>
          <Route path="/solicitudes/nueva" element={<NuevaSolicitudPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('option', { name: 'Pizarras Interactivas' })).toBeVisible();
  });

  it('[ADM-20 CA-1] una categoría desactivada desaparece de los filtros de la bandeja', async () => {
    const antes = renderHook(() => useCatalogosBandeja());
    await waitFor(() => expect(nombres(antes.result.current.categorias)).toContain('Mobiliario'));
    antes.unmount();

    await apiClient.del('/categorias/3');
    const despues = renderHook(() => useCatalogosBandeja());

    await waitFor(() => expect(despues.result.current.categorias.length).toBeGreaterThan(0));
    expect(nombres(despues.result.current.categorias)).not.toContain('Mobiliario');
  });

  it('[ADM-20 CA-1] un área creada en la pantalla de administración aparece en el filtro del dashboard', async () => {
    const admin = render(<AreasPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Nueva área' }));
    const dialogo = within(screen.getByRole('dialog', { name: 'Nueva área' }));
    await userEvent.type(dialogo.getByLabelText('Nombre'), 'Servicios Generales');
    await userEvent.type(dialogo.getByLabelText('Correo de contacto'), 'generales@universidad.edu');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('creada'));
    admin.unmount();

    const { result } = renderHook(() => useAreas(true));

    await waitFor(() => expect(nombres(result.current.areas)).toContain('Servicios Generales'));
  });

  it('[ADM-20 CA-1] un área desactivada deja de ofrecerse en el filtro del dashboard', async () => {
    await apiClient.del('/areas/2');

    const { result } = renderHook(() => useAreas(true));

    await waitFor(() => expect(result.current.areas.length).toBeGreaterThan(0));
    expect(nombres(result.current.areas)).not.toContain('Infraestructura');
  });
});
