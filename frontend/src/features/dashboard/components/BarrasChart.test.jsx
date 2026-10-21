import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { formatValor } from '../chartUtils.js';
import BarrasChart from './BarrasChart.jsx';

const items = [
  { nombre: 'Redes', valor: 12, color: '#1D4ED8' },
  { nombre: 'Software', valor: 0, color: '#047857' },
  { nombre: 'Mobiliario', valor: 5, color: '#B45309' },
];

// Selectores de Recharts 3.10.1 (clases internas; revisar al actualizar la librería).
const SEL = {
  etiqueta: '.recharts-label',
  barra: '.recharts-bar-rectangle path',
  tick: '.recharts-cartesian-axis-tick-value',
  // En 3.10.1 las etiquetas del eje no son hijas de `.recharts-xAxis`: viven en su propia capa.
  etiquetasEje: (nombre) => `.recharts-${nombre}-tick-labels`,
};
const etiquetas = (container) =>
  [...container.querySelectorAll(SEL.etiqueta)].map((e) => e.textContent);
const colores = (container) =>
  [...container.querySelectorAll(SEL.barra)].map((p) => p.getAttribute('fill'));
const ticks = (container, eje) =>
  [...container.querySelectorAll(`${SEL.etiquetasEje(eje)} ${SEL.tick}`)].map((t) => t.textContent);

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
