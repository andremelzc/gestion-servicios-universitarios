import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import ResponsableBarChart from './ResponsableBarChart.jsx';

// CA-9: ejemplo de la spec (Carlos 18, Lucía 11), de mayor a menor.
const datos = [
  { nombre: 'Carlos Ruiz', valor: 18 },
  { nombre: 'Lucía Vega', valor: 11 },
];

describe('ResponsableBarChart', () => {
  it('[US-30 CA-13] muestra el título y se expone como imagen con resumen', () => {
    render(<ResponsableBarChart datos={datos} />);

    expect(
      screen.getByRole('heading', { name: 'Solicitudes por responsable' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Gráfico de barras horizontales: Solicitudes por responsable. Carlos Ruiz: 18. Lucía Vega: 11.',
    );
  });

  it('[US-30 CA-9] ordena de mayor a menor aunque lleguen desordenados', () => {
    render(<ResponsableBarChart datos={[...datos].reverse()} />);

    const filas = within(
      screen.getByRole('list', { name: 'Leyenda: Solicitudes por responsable' }),
    ).getAllByRole('listitem');
    expect(filas.map((f) => f.textContent)).toEqual(['Carlos Ruiz18', 'Lucía Vega11']);
  });

  it('[US-30 CA-9] dibuja una barra por responsable con etiqueta de valor', () => {
    const { container } = render(<ResponsableBarChart datos={datos} />);

    expect(container.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(2);
    const etiquetas = [...container.querySelectorAll('.recharts-label')].map((e) => e.textContent);
    expect(etiquetas).toEqual(['18', '11']);
  });

  it('[US-30 CA-9] las barras usan el color primario del sistema de diseño', () => {
    const { container } = render(<ResponsableBarChart datos={datos} />);

    const barras = [...container.querySelectorAll('.recharts-bar-rectangle path')].map((p) =>
      p.getAttribute('fill'),
    );
    expect(barras).toEqual(['#1D4ED8', '#1D4ED8']);
  });

  it('[US-30 CA-13] "Ver datos" muestra la tabla con las solicitudes asignadas', async () => {
    const user = userEvent.setup();
    render(<ResponsableBarChart datos={datos} />);

    await user.click(screen.getByRole('button', { name: 'Ver datos' }));

    const tabla = screen.getByRole('table', {
      name: 'Solicitudes por responsable',
    });
    expect(within(tabla).getByRole('columnheader', { name: 'Asignadas' })).toBeInTheDocument();
    expect(within(tabla).getByRole('cell', { name: '18' })).toBeInTheDocument();
  });

  it('[US-30 CA-11] con datos vacíos o sin la prop muestra el estado vacío', () => {
    const { unmount, container } = render(<ResponsableBarChart datos={[]} />);
    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
    expect(container.querySelector('.recharts-wrapper')).toBeNull();
    unmount();

    render(<ResponsableBarChart />);
    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
  });

  it('[US-30 CA-11] si todos los responsables tienen 0 muestra el estado vacío', () => {
    const { container } = render(
      <ResponsableBarChart datos={[{ nombre: 'Carlos Ruiz', valor: 0 }]} />,
    );

    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
    expect(container.querySelector('.recharts-wrapper')).toBeNull();
  });

  it('[US-30 CA-13] acepta nivelTitulo', () => {
    render(<ResponsableBarChart datos={datos} nivelTitulo={2} />);

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});
