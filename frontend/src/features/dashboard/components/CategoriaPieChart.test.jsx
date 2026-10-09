import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import CategoriaPieChart from './CategoriaPieChart.jsx';

// Ejemplo del contrato API §3.4 / CA-5.
const datos = [
  { nombre: 'Redes y Wi-Fi', valor: 30 },
  { nombre: 'Software', valor: 20 },
  { nombre: 'Mobiliario', valor: 10 },
];

describe('CategoriaPieChart', () => {
  it('[US-13 CA-13] muestra el título del gráfico', () => {
    render(<CategoriaPieChart datos={datos} />);

    expect(screen.getByRole('heading', { name: 'Solicitudes por categoría' })).toBeInTheDocument();
  });

  it('[US-13 CA-13] es una imagen con aria-label que resume cada categoría y su valor', () => {
    render(<CategoriaPieChart datos={datos} />);

    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Gráfico de dona: Solicitudes por categoría. Redes y Wi-Fi: 30. Software: 20. Mobiliario: 10.',
    );
  });

  it('[US-13 CA-5] la leyenda muestra valor y porcentaje de cada categoría; la suma es el total', () => {
    render(<CategoriaPieChart datos={datos} />);

    const filas = within(
      screen.getByRole('list', { name: 'Leyenda: Solicitudes por categoría' }),
    ).getAllByRole('listitem');
    expect(filas).toHaveLength(3);
    expect(filas[0]).toHaveTextContent('Redes y Wi-Fi');
    expect(filas[0]).toHaveTextContent('30 (50 %)');
    expect(filas[1]).toHaveTextContent('20 (33.3 %)');
    expect(filas[2]).toHaveTextContent('10 (16.7 %)');
  });

  it('[US-13 CA-5] "Ver datos" muestra la tabla con nombre, solicitudes y porcentaje', async () => {
    const user = userEvent.setup();
    render(<CategoriaPieChart datos={datos} />);

    await user.click(screen.getByRole('button', { name: 'Ver datos' }));

    const tabla = screen.getByRole('table', {
      name: 'Solicitudes por categoría',
    });
    expect(within(tabla).getAllByRole('row')).toHaveLength(4);
    expect(within(tabla).getByRole('rowheader', { name: 'Software' })).toBeInTheDocument();
    expect(within(tabla).getByRole('cell', { name: '33.3 %' })).toBeInTheDocument();
  });

  it('[US-13 CA-13] dibuja una dona de Recharts con un sector por categoría', () => {
    const { container } = render(<CategoriaPieChart datos={datos} />);

    expect(container.querySelectorAll('.recharts-pie-sector')).toHaveLength(3);
  });

  it('[US-13 CA-13] los sectores usan los mismos colores que la leyenda, distintos entre sí', () => {
    const { container } = render(<CategoriaPieChart datos={datos} />);

    const colores = [...container.querySelectorAll('.recharts-pie-sector path')].map((p) =>
      p.getAttribute('fill'),
    );
    const muestras = [...container.querySelectorAll('.chart-card__muestra rect')].map((r) =>
      r.getAttribute('fill'),
    );
    expect(new Set(colores).size).toBe(3);
    expect(colores).toEqual(muestras);
    expect(colores).not.toContain('#8884d8'); // color por defecto de Recharts
  });

  it('[US-13 CA-11] con datos vacíos muestra el estado vacío y no dibuja la dona', () => {
    const { container } = render(<CategoriaPieChart datos={[]} />);

    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
    expect(container.querySelector('.recharts-wrapper')).toBeNull();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('[US-13 CA-11] sin la prop datos no falla', () => {
    render(<CategoriaPieChart />);

    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
  });

  it('[US-13 CA-11] si todas las categorías valen 0 muestra el estado vacío, sin dona en blanco ni NaN', () => {
    const { container } = render(
      <CategoriaPieChart datos={[{ nombre: 'Redes y Wi-Fi', valor: 0 }]} />,
    );

    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
    expect(container.querySelector('.recharts-wrapper')).toBeNull();
    expect(container).not.toHaveTextContent('NaN');
  });

  it('[US-13 CA-5] con 9 categorías la primera y la última no comparten color (dona circular)', () => {
    const nueve = Array.from({ length: 9 }, (_, i) => ({ nombre: `Cat ${i + 1}`, valor: i + 1 }));
    const { container } = render(<CategoriaPieChart datos={nueve} />);

    const colores = [...container.querySelectorAll('.chart-card__muestra rect')].map((r) =>
      r.getAttribute('fill'),
    );
    expect(colores).toHaveLength(9);
    expect(colores[8]).not.toBe(colores[0]);
    expect(colores[8]).not.toBe(colores[7]);
  });

  it('[US-13 CA-13] acepta nivelTitulo para mantener la jerarquía de la página', () => {
    render(<CategoriaPieChart datos={datos} nivelTitulo={2} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Solicitudes por categoría' }),
    ).toBeInTheDocument();
  });
});
