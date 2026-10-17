import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { formatValor } from '../chartUtils.js';
import BarrasChart from './BarrasChart.jsx';
import CategoriaPieChart from './CategoriaPieChart.jsx';
import ChartCard from './ChartCard.jsx';
import EstadoBarChart from './EstadoBarChart.jsx';
import PrioridadBarChart from './PrioridadBarChart.jsx';
import ResponsableBarChart from './ResponsableBarChart.jsx';

const items = [
  { nombre: 'Redes', valor: 12, color: '#1D4ED8' },
  { nombre: 'Software', valor: 0, color: '#047857' },
  { nombre: 'Mobiliario', valor: 5, color: '#B45309' },
];

const etiquetas = (container) =>
  [...container.querySelectorAll('.recharts-label')].map((e) => e.textContent);
const colores = (container) =>
  [...container.querySelectorAll('.recharts-bar-rectangle path')].map((p) =>
    p.getAttribute('fill'),
  );
const ticks = (container, eje) =>
  [
    ...container.querySelectorAll(
      `.recharts-${eje}-tick-labels .recharts-cartesian-axis-tick-value`,
    ),
  ].map((t) => t.textContent);

describe('BarrasChart', () => {
  it('[DASH-19 CA-13] con datos dibuja una barra por item con alto y con el color recibido', () => {
    const { container } = render(<BarrasChart items={items} etiquetaValor="Solicitudes" />);

    expect(colores(container)).toEqual(['#1D4ED8', '#B45309']); // la barra de valor 0 no tiene alto: Recharts no la dibuja
  });

  it('[DASH-19 CA-13] cada barra tiene etiqueta de valor, también la de valor 0 (el color no es el único indicador)', () => {
    const { container } = render(<BarrasChart items={items} etiquetaValor="Solicitudes" />);

    expect(etiquetas(container)).toEqual(['12', '0', '5']);
  });

  it('[DASH-19 CA-13] formatea las etiquetas con separador de miles es-PE', () => {
    const { container } = render(
      <BarrasChart items={[{ nombre: 'Redes', valor: 1234, color: '#1D4ED8' }]} />,
    );

    expect(etiquetas(container)).toEqual([formatValor(1234)]);
  });

  it('[DASH-19 CA-13] en vertical los nombres van en el eje horizontal', () => {
    const { container } = render(<BarrasChart items={items} etiquetaValor="Solicitudes" />);

    expect(ticks(container, 'xAxis')).toEqual(['Redes', 'Software', 'Mobiliario']);
  });

  it('[DASH-19 CA-13] en horizontal los nombres van en el eje vertical y el de valores está oculto', () => {
    const { container } = render(
      <BarrasChart items={items} horizontal etiquetaValor="Solicitudes" />,
    );

    expect(ticks(container, 'yAxis')).toEqual(['Redes', 'Software', 'Mobiliario']);
    expect(ticks(container, 'xAxis')).toEqual([]);
  });

  it('[DASH-19 CA-13] ocupa todo el ancho disponible (responsive) y no fija un ancho en píxeles', () => {
    const { container } = render(<BarrasChart items={items} etiquetaValor="Solicitudes" />);

    const contenedor = container.querySelector('.recharts-responsive-container');
    expect(contenedor).toHaveStyle({ width: '100%' });
  });

  it('[DASH-19 CA-13] el alto horizontal crece con la cantidad de barras para que no se aplasten', () => {
    const muchos = Array.from({ length: 12 }, (_, i) => ({
      nombre: `Técnico ${i + 1}`,
      valor: i + 1,
      color: '#1D4ED8',
    }));
    const { container: pocos } = render(<BarrasChart items={items} horizontal />);
    const { container: varios } = render(<BarrasChart items={muchos} horizontal />);

    const alto = (c) =>
      parseInt(c.querySelector('.recharts-responsive-container').style.height, 10);
    expect(alto(pocos)).toBe(280);
    expect(alto(varios)).toBe(12 * 44);
  });
});

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
  ])(
    '[DASH-19 CA-11] %s con datos vacíos muestra el estado vacío sin NaN ni gráfico',
    (_n, Grafico) => {
      const { container } = render(<Grafico datos={[]} />);

      expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
      expect(container.querySelector('svg.recharts-surface')).toBeNull();
      expect(container).not.toHaveTextContent('NaN');
    },
  );

  it('[DASH-19 CA-11] un valor ausente (null) en un item no produce NaN en el resumen ni en la leyenda', () => {
    const { container } = render(
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

    expect(container).not.toHaveTextContent('NaN');
    expect(screen.getByRole('img').getAttribute('aria-label')).not.toMatch(/NaN/);
  });
});
