import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { apiClient } from '../../../services/apiClient.js';
import DetalleSolicitudPage from './DetalleSolicitudPage.jsx';

vi.mock('../../auth/AuthContext.jsx', () => ({
  useAuth: () => ({ usuario: { rol: 'ESTUDIANTE' } }),
}));
vi.mock('../../../services/apiClient.js', () => ({ apiClient: { get: vi.fn() } }));

beforeEach(() => vi.resetAllMocks());

it('muestra el detalle y el historial recibidos del servidor', async () => {
  apiClient.get.mockImplementation((ruta) =>
    Promise.resolve(
      ruta.endsWith('/historial')
        ? [
            {
              fecha: '2026-10-03T15:04:05Z',
              usuario: 'Ana',
              estadoNuevo: 'REGISTRADA',
              nota: 'Creada',
            },
          ]
        : {
            codigo: 'SOL-001',
            titulo: 'Proyector',
            descripcion: 'No funciona',
            estadoCodigo: 'REGISTRADA',
            prioridadNivel: 'ALTA',
            fechaLimiteSla: '2100-10-03T15:04:05Z',
            evidencias: [],
          },
    ),
  );
  render(
    <MemoryRouter initialEntries={['/solicitudes/42']}>
      <Routes>
        <Route path="/solicitudes/:id" element={<DetalleSolicitudPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByRole('heading', { name: /SOL-001/ })).toBeInTheDocument();
  expect(screen.getByText('Creada')).toBeInTheDocument();
  expect(screen.getByText(/Vence en/)).toBeInTheDocument();
  expect(screen.getByText('Sin evidencias.')).toBeInTheDocument();
  expect(apiClient.get).toHaveBeenCalledWith('/solicitudes/42/historial', expect.any(Object));
  const historial = screen.getByText('Historial').closest('details');
  expect(historial).toHaveAttribute('open');
  await userEvent.click(screen.getByText('Historial'));
  expect(historial).not.toHaveAttribute('open');
  await userEvent.click(screen.getByText('Historial'));
  expect(historial).toHaveAttribute('open');
});

it('permite reintentar cuando falla la carga', async () => {
  apiClient.get.mockRejectedValueOnce({ status: 500 });
  apiClient.get.mockResolvedValueOnce([]);
  apiClient.get.mockResolvedValueOnce({ codigo: 'SOL-002', titulo: 'Equipo', evidencias: [] });
  apiClient.get.mockResolvedValueOnce([]);
  apiClient.get.mockResolvedValue([]);
  render(
    <MemoryRouter initialEntries={['/solicitudes/42']}>
      <Routes>
        <Route path="/solicitudes/:id" element={<DetalleSolicitudPage />} />
      </Routes>
    </MemoryRouter>,
  );
  await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
  await waitFor(() => expect(screen.getByRole('heading', { name: /SOL-002/ })).toBeInTheDocument());
});

it('muestra un error incluso si el servidor devuelve errores de campo sin mensaje general', async () => {
  apiClient.get.mockRejectedValue({ status: 400, errores: { id: 'Identificador inválido' } });
  render(
    <MemoryRouter initialEntries={['/solicitudes/invalido']}>
      <Routes>
        <Route path="/solicitudes/:id" element={<DetalleSolicitudPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar la solicitud.');
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
});

it('muestra los campos anidados documentados en el contrato API', async () => {
  apiClient.get.mockImplementation((ruta) =>
    Promise.resolve(
      ruta.endsWith('/historial')
        ? []
        : {
            codigo: 'SOL-003',
            titulo: 'Equipo',
            categoria: { nombre: 'Informática' },
            area: { nombre: 'Soporte' },
            prioridad: 'ALTA',
            estado: { codigo: 'ASIGNADA', nombreVisible: 'Asignada', colorHex: '#2563EB' },
            solicitante: { nombre: 'Ana', apellido: 'Pérez' },
            tecnico: { nombre: 'Luis', apellido: 'Torres' },
            evidencias: [],
          },
    ),
  );
  render(
    <MemoryRouter initialEntries={['/solicitudes/42']}>
      <Routes>
        <Route path="/solicitudes/:id" element={<DetalleSolicitudPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByText('Informática')).toBeInTheDocument();
  expect(screen.getByText('Soporte')).toBeInTheDocument();
  expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
  expect(screen.getByText('Luis Torres')).toBeInTheDocument();
});

it('descarga una evidencia mediante el cliente autenticado', async () => {
  const archivo = new Blob(['evidencia'], { type: 'application/pdf' });
  apiClient.get.mockImplementation((ruta) => {
    if (ruta.endsWith('/historial')) return Promise.resolve([]);
    if (ruta.endsWith('/evidencias/31')) return Promise.resolve(archivo);
    return Promise.resolve({
      codigo: 'SOL-004',
      titulo: 'Equipo',
      evidencias: [{ id: 31, nombre: 'foto.pdf' }],
    });
  });
  const crearUrl = vi.fn(() => 'blob:test');
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: crearUrl, revokeObjectURL: vi.fn() }));
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  render(
    <MemoryRouter initialEntries={['/solicitudes/42']}>
      <Routes>
        <Route path="/solicitudes/:id" element={<DetalleSolicitudPage />} />
      </Routes>
    </MemoryRouter>,
  );
  await userEvent.click(await screen.findByRole('button', { name: 'foto.pdf' }));
  expect(apiClient.get).toHaveBeenCalledWith('/solicitudes/42/evidencias/31', {
    responseType: 'blob',
  });
  expect(crearUrl).toHaveBeenCalledWith(archivo);
  expect(click).toHaveBeenCalledOnce();
  click.mockRestore();
  vi.unstubAllGlobals();
});
