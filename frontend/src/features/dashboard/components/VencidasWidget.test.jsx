import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import { server } from '../../../test/server.js';
import VencidasWidget from './VencidasWidget.jsx';

it('solicita cada página conservando los filtros y enlaza el resultado', async () => {
  const consultas = [];
  server.use(
    http.get('*/api/v1/dashboard/vencidas', ({ request }) => {
      const query = new URL(request.url).searchParams;
      consultas.push(query.toString());
      const page = Number(query.get('page'));
      return HttpResponse.json({
        content: [{ id: page + 1, codigo: `SOL-${page + 1}`, titulo: 'Solicitud' }],
        number: page,
        size: 1,
        totalElements: 2,
        totalPages: 2,
      });
    }),
  );
  render(
    <MemoryRouter>
      <VencidasWidget filtros={{ desde: '2026-10-01', idArea: 3 }} />
    </MemoryRouter>,
  );
  expect(await screen.findByRole('link', { name: 'SOL-1' })).toHaveAttribute(
    'href',
    '/solicitudes/1',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  expect(await screen.findByRole('link', { name: 'SOL-2' })).toHaveAttribute(
    'href',
    '/solicitudes/2',
  );
  expect(consultas).toEqual([
    'desde=2026-10-01&idArea=3&page=0',
    'desde=2026-10-01&idArea=3&page=1',
  ]);
});
