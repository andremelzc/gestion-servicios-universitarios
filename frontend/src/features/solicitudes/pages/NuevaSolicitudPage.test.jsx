import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../test/server.js';
import { MSG_ARCHIVO_GRANDE, TAMANO_MAXIMO_BYTES } from '../evidencias.js';
import { DESCRIPCION_MAX, DESCRIPCION_MIN, mensajeDescripcionCorta } from '../schemas.js';
import NuevaSolicitudPage, { CLAVE_BORRADOR } from './NuevaSolicitudPage.jsx';

const CAMPOS_FORMULARIO = [
  'Título',
  'Categoría',
  'Prioridad',
  'Campus',
  'Ubicación (aula/laboratorio)',
  'Descripción',
];

function PantallaConfirmacion() {
  const { state } = useLocation();
  return <p>Confirmación{state?.codigo ? ` — ${state.codigo}` : ''}</p>;
}

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/solicitudes/nueva']}>
      <Routes>
        <Route path="/solicitudes/nueva" element={<NuevaSolicitudPage />} />
        <Route path="/solicitudes/confirmacion" element={<PantallaConfirmacion />} />
        <Route path="/mis-solicitudes" element={<p>Mis solicitudes</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

// Cuerpo `application/problem+json` reducido (api-rest §1.2), igual que los handlers compartidos.
function problema(status, detail, { errores, tipo = 'validacion' } = {}) {
  return HttpResponse.json(
    {
      type: `https://servicios.universidad.edu/problemas/${tipo}`,
      title: 'Error',
      status,
      detail,
      instance: '/api/v1/solicitudes',
      ...(errores ? { errores } : {}),
    },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

async function llenarValido(user) {
  await screen.findByRole('option', { name: 'Equipos de Cómputo' });
  await user.type(screen.getByLabelText('Título'), 'Proyector sin imagen');
  await user.selectOptions(screen.getByLabelText('Categoría'), '2');
  await user.selectOptions(screen.getByLabelText('Prioridad'), '3');
  await user.type(screen.getByLabelText('Campus'), 'Campus Central');
  await user.type(screen.getByLabelText('Ubicación (aula/laboratorio)'), 'Pabellón B - Aula 402');
  await user.type(
    screen.getByLabelText('Descripción'),
    'El proyector del aula B-402 enciende pero no muestra imagen por HDMI.',
  );
}

// jsdom y undici no comparten las clases File/Blob/FormData y el multipart se rompe:
// el FormData de jsdom convierte los Blob ajenos a texto y el parser de undici rechaza los
// File de jsdom (caso conocido de MSW). Esta suite usa las clases de Node para que el envío
// multipart real de la página llegue íntegro a los handlers.
beforeAll(async () => {
  const FormDataUndici = (
    await new Response('--b--\r\n', {
      headers: { 'Content-Type': 'multipart/form-data; boundary=b' },
    }).formData()
  ).constructor;
  vi.stubGlobal('Blob', NodeBlob);
  vi.stubGlobal('File', NodeFile);
  vi.stubGlobal('FormData', FormDataUndici);
  // jsdom no acepta los File de Node en su createObjectURL: se simula la miniatura.
  Object.defineProperty(URL, 'createObjectURL', {
    value: vi.fn(() => 'blob:miniatura'),
    configurable: true,
    writable: true,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: vi.fn(),
    configurable: true,
    writable: true,
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
  delete URL.createObjectURL;
  delete URL.revokeObjectURL;
});

beforeEach(() => {
  sessionStorage.clear();
});

describe('NuevaSolicitudPage (REG-15 · US-05/US-06)', () => {
  it('[REG-15] renderiza el formulario, el contador y los catálogos activos', async () => {
    renderPagina();

    expect(screen.getByRole('heading', { name: 'Nueva solicitud' })).toBeInTheDocument();
    for (const etiqueta of CAMPOS_FORMULARIO) {
      expect(screen.getByLabelText(etiqueta)).toBeInTheDocument();
    }
    expect(screen.getByText('Evidencias (opcional)')).toBeInTheDocument();
    expect(
      screen.getByText(`0 / ${DESCRIPCION_MAX} · mín. ${DESCRIPCION_MIN}`),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute(
      'href',
      '/mis-solicitudes',
    );
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeEnabled();

    // Catálogos de solo activos (RN-14) con la prioridad en etiqueta legible.
    expect(await screen.findByRole('option', { name: 'Equipos de Cómputo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Mobiliario' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Alta' })).toBeInTheDocument();
  });

  it('[REG-15] CA-3: bloquea el envío y marca los campos obligatorios', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.click(await screen.findByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('El título es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La categoría es obligatoria')).toBeInTheDocument();
    expect(screen.getByText('La prioridad es obligatoria')).toBeInTheDocument();
    expect(screen.getByText('La ubicación del campus es obligatoria')).toBeInTheDocument();
    expect(screen.getByText('La ubicación del ambiente es obligatoria')).toBeInTheDocument();
    expect(screen.getByText('La descripción es obligatoria')).toBeInTheDocument();
    expect(screen.queryByText('Confirmación')).not.toBeInTheDocument();
  });

  it('[REG-15] CA-3: la descripción corta usa el microcopy de UX §9 con la cuenta', async () => {
    const user = userEvent.setup();
    renderPagina();
    await llenarValido(user);

    const descripcion = screen.getByLabelText('Descripción');
    await user.clear(descripcion);
    await user.type(descripcion, 'Corto');
    expect(
      screen.getByText(`5 / ${DESCRIPCION_MAX} · mín. ${DESCRIPCION_MIN}`),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByText(mensajeDescripcionCorta(5))).toBeInTheDocument();
    expect(screen.queryByText('Confirmación')).not.toBeInTheDocument();
  });

  it('[REG-15] RN-18: rechaza etiquetas HTML (paridad con SinHtmlValidator)', async () => {
    const user = userEvent.setup();
    renderPagina();
    await llenarValido(user);

    const titulo = screen.getByLabelText('Título');
    await user.clear(titulo);
    await user.type(titulo, 'Proyector <b>sin</b> imagen');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(
      await screen.findByText('No se permiten etiquetas HTML en este campo.'),
    ).toBeInTheDocument();
  });

  it('[REG-15] guarda el borrador en sessionStorage y lo restaura al volver', async () => {
    const user = userEvent.setup();
    const { unmount } = renderPagina();

    await user.type(screen.getByLabelText('Título'), 'Proyector sin imagen');
    await screen.findByRole('option', { name: 'Alta' });
    await user.selectOptions(screen.getByLabelText('Prioridad'), '3');

    expect(JSON.parse(sessionStorage.getItem(CLAVE_BORRADOR))).toMatchObject({
      titulo: 'Proyector sin imagen',
      idPrioridad: '3',
    });

    unmount();
    renderPagina();

    expect(screen.getByLabelText('Título')).toHaveValue('Proyector sin imagen');
    await screen.findByRole('option', { name: 'Alta' });
    expect(screen.getByLabelText('Prioridad')).toHaveValue('3');
  });

  it('[REG-15] CA-1/UAT-02: envía multipart y navega a la confirmación con el código', async () => {
    const capturado = {};
    server.use(
      http.post('*/api/v1/solicitudes', async ({ request }) => {
        const partes = await request.formData();
        const parteSolicitud = partes.get('solicitud');
        capturado.solicitud = JSON.parse(
          typeof parteSolicitud === 'string' ? parteSolicitud : await parteSolicitud.text(),
        );
        capturado.archivos = partes.getAll('archivos');
        return HttpResponse.json(
          {
            id: 150,
            codigo: 'SOL-2026-0150',
            titulo: capturado.solicitud.titulo,
            estado: 'REGISTRADA',
            fechaRegistro: '2026-10-17T15:04:05',
            fechaLimiteSla: '2026-10-18T15:04:05',
            mensaje: 'Solicitud registrada con éxito',
          },
          { status: 201, headers: { Location: '/api/v1/solicitudes/150' } },
        );
      }),
    );
    const user = userEvent.setup();
    renderPagina();
    await llenarValido(user);

    const foto = new File([new Uint8Array(1024)], 'foto.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText('Evidencias (opcional)'), foto);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('Confirmación — SOL-2026-0150')).toBeInTheDocument();
    expect(capturado.solicitud).toEqual({
      titulo: 'Proyector sin imagen',
      descripcion: 'El proyector del aula B-402 enciende pero no muestra imagen por HDMI.',
      ubicacionCampus: 'Campus Central',
      ubicacionAmbiente: 'Pabellón B - Aula 402',
      idCategoria: 2,
      idPrioridad: 3,
    });
    expect(capturado.archivos).toHaveLength(1);
    expect(capturado.archivos[0].name).toBe('foto.jpg');
    expect(sessionStorage.getItem(CLAVE_BORRADOR)).toBeNull();
  });

  it('[REG-15] CA-4: deshabilita el envío cuando una evidencia excede los 5 MB', async () => {
    const user = userEvent.setup();
    renderPagina();
    await llenarValido(user);

    const grande = new File([new Uint8Array(TAMANO_MAXIMO_BYTES + 1)], 'grande.png', {
      type: 'image/png',
    });
    await user.upload(screen.getByLabelText('Evidencias (opcional)'), grande);

    expect(await screen.findByText(MSG_ARCHIVO_GRANDE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });

  it('[REG-15] pinta los 400 por campo del backend y limpia el aviso al corregir', async () => {
    server.use(
      http.post('*/api/v1/solicitudes', () =>
        problema(400, 'Validación fallida', {
          errores: { ubicacionCampus: 'El campus no existe en el catálogo.' },
        }),
      ),
    );
    const user = userEvent.setup();
    renderPagina();
    await llenarValido(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('El campus no existe en el catálogo.')).toBeInTheDocument();
    expect(screen.queryByText('Confirmación')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Campus'), ' Norte');
    expect(screen.queryByText('El campus no existe en el catálogo.')).not.toBeInTheDocument();
  });

  it('[REG-15] muestra el aviso general del servidor (413) sin navegar', async () => {
    server.use(
      http.post('*/api/v1/solicitudes', () =>
        problema(
          413,
          'El archivo excede los 5 MB permitidos. Reduce su tamaño e inténtalo de nuevo.',
        ),
      ),
    );
    const user = userEvent.setup();
    renderPagina();
    await llenarValido(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('excede los 5 MB');
    expect(screen.queryByText('Confirmación')).not.toBeInTheDocument();
  });

  it('[REG-15] muestra el error de catálogos y permite reintentar', async () => {
    server.use(
      http.get('*/api/v1/prioridades', () => problema(500, 'Error interno'), { once: true }),
    );
    const user = userEvent.setup();
    renderPagina();

    expect(await screen.findByText('Ocurrió un error inesperado.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('option', { name: 'Alta' })).toBeInTheDocument();
    expect(screen.queryByText('Ocurrió un error inesperado.')).not.toBeInTheDocument();
  });
});
