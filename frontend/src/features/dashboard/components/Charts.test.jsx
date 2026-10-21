import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CategoriaPieChart from './CategoriaPieChart.jsx';
import ChartCard from './ChartCard.jsx';
import EstadoBarChart from './EstadoBarChart.jsx';
import PrioridadBarChart from './PrioridadBarChart.jsx';
import ResponsableBarChart from './ResponsableBarChart.jsx';

// Selectores de Recharts 3.10.1 (clases internas; revisar al actualizar la librería).
const SEL = {
  etiqueta: '.recharts-label',
  svg: 'svg.recharts-surface',
};
const etiquetas = (container) =>
  [...container.querySelectorAll(SEL.etiqueta)].map((e) => e.textContent);

// Los cuatro gráficos comparten ChartCard: mismas garantías con datos mezclados y no válidos.
describe('Gráficos del dashboard: datos parciales y no válidos', () => {
  it('[DASH-19 CA-11] con algunos valores en 0 (y otros no) dibuja el gráfico, no el estado vacío', () => {
    const { container } = render(
      <PrioridadBarChart
        datos={[
          { nombre: 'BAJA', valor: 0 },
          { nombre: 'ALTA', valor: 4 },
        ]}
      />,
    );

    expect(screen.queryByText('Sin datos para mostrar.')).not.toBeInTheDocument();
    expect(etiquetas(container)).toEqual(['0', '4']);
  });

  it.each([
    ['CategoriaPieChart', CategoriaPieChart],
    ['EstadoBarChart', EstadoBarChart],
    ['PrioridadBarChart', PrioridadBarChart],
    ['ResponsableBarChart', ResponsableBarChart],
  ])('[DASH-19 CA-11] %s con datos vacíos muestra el estado vacío y sin SVG', (_n, Grafico) => {
    const { container } = render(<Grafico datos={[]} />);

    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
    expect(container.querySelector(SEL.svg)).toBeNull();
  });

  it('[DASH-19 CA-11] un valor ausente (null) se muestra como 0 en el resumen y en la leyenda', () => {
    render(
      <ChartCard
        titulo="Por categoría"
        tipo="Gráfico de barras"
        items={[
          { nombre: 'Redes', valor: 5, color: '#1D4ED8' },
          { nombre: 'Software', valor: null, color: '#047857' },
        ]}
      >
        <svg />
      </ChartCard>,
    );

    expect(screen.getByRole('img')).toHaveAccessibleName(/Software: 0/);
    const leyenda = within(screen.getByRole('list', { name: 'Leyenda: Por categoría' }));
    expect(leyenda.getAllByRole('listitem')[1]).toHaveTextContent('Software0');
  });
});
