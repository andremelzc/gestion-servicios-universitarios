import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ConfirmacionSolicitudPage from './ConfirmacionSolicitudPage.jsx';

const CONFIRMACION = {
  pathname: '/solicitudes/confirmacion',
  state: { id: 150, codigo: 'SOL-2026-0150' },
};

function renderPagina(entrada = CONFIRMACION) {
  return render(
    <MemoryRouter initialEntries={[entrada]}>
      <Routes>
        <Route path="/solicitudes/confirmacion" element={<ConfirmacionSolicitudPage />} />
        <Route path="/mis-solicitudes" element={<p>Mis solicitudes</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ConfirmacionSolicitudPage (REG-17 · US-07)', () => {
  it('[REG-17] CA-1: muestra el estado Registrada, el código y el microcopy de UX §9', () => {
    renderPagina();

    expect(screen.getByRole('heading', { name: 'Solicitud registrada' })).toBeInTheDocument();
    const panel = screen.getByRole('status');
    expect(panel).toHaveTextContent('Registrada: SOL-2026-0150');
    expect(panel).toHaveTextContent(
      'Tu solicitud SOL-2026-0150 fue registrada. Te avisaremos cuando cambie de estado.',
    );
  });

  it('[REG-17] enlaza a "Ver mi solicitud" (detalle) y "Registrar otra" (formulario)', () => {
    renderPagina();

    expect(screen.getByRole('link', { name: 'Ver mi solicitud' })).toHaveAttribute(
      'href',
      '/solicitudes/150',
    );
    expect(screen.getByRole('link', { name: 'Registrar otra' })).toHaveAttribute(
      'href',
      '/solicitudes/nueva',
    );
  });

  it('[REG-17] sin state (recarga directa) vuelve a /mis-solicitudes', () => {
    renderPagina('/solicitudes/confirmacion');

    expect(screen.getByText('Mis solicitudes')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Solicitud registrada' })).not.toBeInTheDocument();
  });

  it('[REG-17] sin id en el state, "Ver mi solicitud" apunta al listado', () => {
    renderPagina({
      pathname: '/solicitudes/confirmacion',
      state: { codigo: 'SOL-2026-0150' },
    });

    expect(screen.getByRole('link', { name: 'Ver mi solicitud' })).toHaveAttribute(
      'href',
      '/mis-solicitudes',
    );
  });
});
