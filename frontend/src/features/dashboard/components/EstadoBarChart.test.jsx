import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import EstadoBarChart from './EstadoBarChart.jsx';

// CA-6: por-estado incluye colorHex de cada estado (valores de UX §2.1).
const datos = [
  { nombre: 'REGISTRADA', valor: 14, colorHex: '#6B7280' },
  { nombre: 'EN_EVALUACION', valor: 22, colorHex: '#D97706' },
  { nombre: 'ASIGNADA', valor: 9, colorHex: '#2563EB' },
  { nombre: 'EN_ATENCION', valor: 5, colorHex: '#7C3AED' },
  { nombre: 'RESUELTA', valor: 30, colorHex: '#059669' },
  { nombre: 'CERRADA', valor: 70, colorHex: '#047857' },
];

describe('EstadoBarChart', () => {
  it('[US-28 CA-13] muestra el título y se expone como imagen con resumen legible', () => {
    render(<EstadoBarChart datos={datos} />);

    expect(screen.getByRole('heading', { name: 'Solicitudes por estado' })).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Gráfico de barras horizontales: Solicitudes por estado. Registrada: 14. En evaluación: 22. Asignada: 9. En atención: 5. Resuelta: 30. Cerrada: 70.',
    );
  });

  it('[US-28 CA-6] la leyenda muestra el nombre visible de cada estado con su valor', () => {
    render(<EstadoBarChart datos={datos} />);

    const filas = within(
      screen.getByRole('list', { name: 'Leyenda: Solicitudes por estado' }),
    ).getAllByRole('listitem');
    expect(filas.map((f) => f.textContent)).toEqual([
      'Registrada14',
      'En evaluación22',
      'Asignada9',
      'En atención5',
      'Resuelta30',
      'Cerrada70',
    ]);
  });

  it('[US-28 CA-6] usa el colorHex de cada estado en la leyenda y en las barras', () => {
    const { container } = render(<EstadoBarChart datos={datos} />);

    const esperado = datos.map((d) => d.colorHex);
    const muestras = [...container.querySelectorAll('.chart-card__muestra rect')].map((r) =>
      r.getAttribute('fill'),
    );
    const barras = [...container.querySelectorAll('.recharts-bar-rectangle path')].map((p) =>
      p.getAttribute('fill'),
    );
    expect(muestras).toEqual(esperado);
    expect(barras).toEqual(esperado);
  });

  it('[US-28 CA-13] el color no es el único indicador: cada barra tiene etiqueta de valor y la tabla alternativa', async () => {
    const user = userEvent.setup();
    const { container } = render(<EstadoBarChart datos={datos} />);

    const etiquetas = [...container.querySelectorAll('.recharts-label')].map((e) => e.textContent);
    expect(etiquetas).toEqual(['14', '22', '9', '5', '30', '70']);

    await user.click(screen.getByRole('button', { name: 'Ver datos' }));
    expect(
      within(screen.getByRole('table')).getByRole('rowheader', {
        name: 'En atención',
      }),
    ).toBeInTheDocument();
  });

  it('[US-28 CA-6] si falta colorHex usa un color neutro en lugar de uno de la librería', () => {
    const { container } = render(<EstadoBarChart datos={[{ nombre: 'REGISTRADA', valor: 1 }]} />);

    const barra = container.querySelector('.recharts-bar-rectangle path');
    expect(barra).toHaveAttribute('fill', '#4B5563');
  });

  it('[US-28 CA-11] con datos vacíos o sin la prop muestra el estado vacío', () => {
    const { unmount, container } = render(<EstadoBarChart datos={[]} />);
    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
    expect(container.querySelector('.recharts-wrapper')).toBeNull();
    unmount();

    render(<EstadoBarChart />);
    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
  });

  it('[US-28 CA-13] usa barras horizontales: los nombres van en el eje vertical y no se solapan en móvil', () => {
    const { container } = render(<EstadoBarChart datos={datos} />);

    // Eje de valores oculto: las únicas marcas del eje son los nombres de estado.
    const ticks = [...container.querySelectorAll('.recharts-cartesian-axis-tick-value')].map(
      (t) => t.textContent,
    );
    expect(ticks).toEqual([
      'Registrada',
      'En evaluación',
      'Asignada',
      'En atención',
      'Resuelta',
      'Cerrada',
    ]);
  });

  it('[US-28 CA-11] si todos los estados valen 0 muestra el estado vacío', () => {
    const { container } = render(
      <EstadoBarChart datos={[{ nombre: 'REGISTRADA', valor: 0, colorHex: '#6B7280' }]} />,
    );

    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
    expect(container.querySelector('.recharts-wrapper')).toBeNull();
  });

  it('[US-28 CA-13] acepta nivelTitulo', () => {
    render(<EstadoBarChart datos={datos} nivelTitulo={2} />);

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});
