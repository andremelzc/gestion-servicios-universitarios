import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { it, expect } from 'vitest';
import VencidasTable from './VencidasTable.jsx';

it('enlaza el código de cada solicitud a su detalle', () => {
  render(
    <MemoryRouter>
      <VencidasTable
        datos={{
          content: [
            {
              id: 5,
              codigo: 'SOL-005',
              titulo: 'Proyector',
              prioridadNivel: 'ALTA',
              estadoNombre: 'Asignada',
              fechaLimiteSla: '2026-10-04T03:00:00',
            },
          ],
        }}
      />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'SOL-005' })).toHaveAttribute('href', '/solicitudes/5');
  expect(screen.getByText('ALTA')).toBeInTheDocument();
  expect(screen.getByText('Asignada')).toBeInTheDocument();
  expect(screen.getByText('3/10/2026')).toBeInTheDocument();
});
