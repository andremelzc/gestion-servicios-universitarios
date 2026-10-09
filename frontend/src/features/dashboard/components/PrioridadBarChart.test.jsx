import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import PrioridadBarChart from './PrioridadBarChart.jsx';

// CA-6: un elemento por prioridad, incluidos los de valor 0, en orden de ponderador.
const datos = [
  { nombre: 'BAJA', valor: 0 },
  { nombre: 'MEDIA', valor: 8 },
  { nombre: 'ALTA', valor: 12 },
  { nombre: 'CRITICA', valor: 3 },
];

describe('PrioridadBarChart', () => {
  it('[US-28 CA-13] muestra el título y se expone como imagen con resumen', () => {
    render(<PrioridadBarChart datos={datos} />);

    expect(screen.getByRole('heading', { name: 'Solicitudes por prioridad' })).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Gráfico de barras: Solicitudes por prioridad. Baja: 0. Media: 8. Alta: 12. Crítica: 3.',
    );
  });

  it('[US-28 CA-6] incluye las prioridades de valor 0 y conserva el orden recibido', () => {
    render(<PrioridadBarChart datos={datos} />);

    const filas = within(
      screen.getByRole('list', { name: 'Leyenda: Solicitudes por prioridad' }),
    ).getAllByRole('listitem');
    expect(filas.map((f) => f.textContent)).toEqual(['Baja0', 'Media8', 'Alta12', 'Crítica3']);
  });

  it('[US-28 CA-6] dibuja una barra por prioridad', () => {
    const { container } = render(<PrioridadBarChart datos={datos} />);

    expect(container.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(4);
  });

  it('[US-28 CA-6] cada prioridad usa su color de tokens (no los de la librería) y coincide con la leyenda', () => {
    const { container } = render(<PrioridadBarChart datos={datos} />);

    const muestras = [...container.querySelectorAll('.chart-card__muestra rect')].map((r) =>
      r.getAttribute('fill'),
    );
    expect(muestras).toEqual(['#047857', '#1D4ED8', '#B45309', '#B91C1C']);
    const barras = [...container.querySelectorAll('.recharts-bar-rectangle path')].map((p) =>
      p.getAttribute('fill'),
    );
    // La barra de valor 0 no tiene altura (no se dibuja su rectángulo); su valor
    // se conserva en la etiqueta, la leyenda y la tabla.
    expect(barras).toEqual(muestras.slice(1));
  });

  it('[US-28 CA-13] muestra el valor de cada barra como etiqueta de texto', () => {
    const { container } = render(<PrioridadBarChart datos={datos} />);

    const etiquetas = [...container.querySelectorAll('.recharts-label')].map((e) => e.textContent);
    expect(etiquetas).toEqual(['0', '8', '12', '3']);
  });

  it('[US-28 CA-13] "Ver datos" está disponible', () => {
    render(<PrioridadBarChart datos={datos} />);

    expect(screen.getByRole('button', { name: 'Ver datos' })).toBeInTheDocument();
  });

  it('[US-28 CA-11] con datos vacíos o sin la prop muestra el estado vacío', () => {
    const { unmount, container } = render(<PrioridadBarChart datos={[]} />);
    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
    expect(container.querySelector('.recharts-wrapper')).toBeNull();
    unmount();

    render(<PrioridadBarChart />);
    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
  });

  it('[US-28 CA-6] los nombres visibles son Baja/Media/Alta/Crítica en la tabla, no los códigos', async () => {
    const user = userEvent.setup();
    render(<PrioridadBarChart datos={datos} />);

    await user.click(screen.getByRole('button', { name: 'Ver datos' }));

    const tabla = screen.getByRole('table');
    expect(within(tabla).getByRole('rowheader', { name: 'Crítica' })).toBeInTheDocument();
    expect(within(tabla).queryByText('CRITICA')).not.toBeInTheDocument();
  });

  it('[US-28 CA-6] el eje muestra los nombres visibles', () => {
    const { container } = render(<PrioridadBarChart datos={datos} />);

    const ticks = [...container.querySelectorAll('.recharts-cartesian-axis-tick-value')]
      .map((t) => t.textContent)
      .filter((t) => !/^\d+$/.test(t));
    expect(ticks).toEqual(['Baja', 'Media', 'Alta', 'Crítica']);
  });

  it('[US-28 CA-11] si todas las prioridades valen 0 muestra el estado vacío', () => {
    const { container } = render(
      <PrioridadBarChart
        datos={[
          { nombre: 'BAJA', valor: 0 },
          { nombre: 'ALTA', valor: 0 },
        ]}
      />,
    );

    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
    expect(container.querySelector('.recharts-wrapper')).toBeNull();
  });

  it('[US-28 CA-13] acepta nivelTitulo', () => {
    render(<PrioridadBarChart datos={datos} nivelTitulo={2} />);

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});
