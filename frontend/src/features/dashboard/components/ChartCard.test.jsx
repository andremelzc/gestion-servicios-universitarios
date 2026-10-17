import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import ChartCard from './ChartCard.jsx';

const css = readFileSync(
  resolve(process.cwd(), 'src/features/dashboard/components/ChartCard.css'),
  'utf8',
);

const items = [
  { nombre: 'Redes y Wi-Fi', valor: 30, color: '#1D4ED8' },
  { nombre: 'Software', valor: 10, color: '#047857' },
];

function renderCard(props = {}) {
  return render(
    <ChartCard titulo="Por categoría" tipo="Gráfico de dona" items={items} {...props}>
      <svg data-testid="grafico" />
    </ChartCard>,
  );
}

describe('ChartCard', () => {
  it('[US-13 CA-13] muestra el título del gráfico como encabezado', () => {
    renderCard();

    expect(screen.getByRole('heading', { level: 3, name: 'Por categoría' })).toBeInTheDocument();
  });

  it('[US-13 CA-13] expone el gráfico como imagen con un aria-label que resume los datos', () => {
    renderCard();

    const imagen = screen.getByRole('img', { name: /Gráfico de dona/ });
    expect(imagen).toHaveAccessibleName(
      'Gráfico de dona: Por categoría. Redes y Wi-Fi: 30. Software: 10.',
    );
    expect(imagen).toContainElement(screen.getByTestId('grafico'));
  });

  it('[US-13 CA-13] la leyenda lista cada elemento con su valor', () => {
    renderCard();

    const leyenda = screen.getByRole('list', { name: 'Leyenda: Por categoría' });
    const filas = within(leyenda).getAllByRole('listitem');
    expect(filas).toHaveLength(2);
    expect(filas[0]).toHaveTextContent('Redes y Wi-Fi');
    expect(filas[0]).toHaveTextContent('30');
    expect(filas[1]).toHaveTextContent('Software');
    expect(filas[1]).toHaveTextContent('10');
  });

  it('[US-13 CA-13] la leyenda muestra el porcentaje solo si se pide', () => {
    const { unmount } = renderCard();
    expect(screen.getByRole('list', { name: 'Leyenda: Por categoría' })).not.toHaveTextContent('%');
    unmount();

    renderCard({ mostrarPorcentaje: true });
    const filas = within(screen.getByRole('list', { name: 'Leyenda: Por categoría' })).getAllByRole(
      'listitem',
    );
    expect(filas[0]).toHaveTextContent('75 %');
    expect(filas[1]).toHaveTextContent('25 %');
  });

  it('[US-13 CA-13] el color de la leyenda es decorativo: el texto transmite la información', () => {
    renderCard();

    const filas = within(screen.getByRole('list', { name: 'Leyenda: Por categoría' })).getAllByRole(
      'listitem',
    );
    const muestra = filas[0].querySelector('svg');
    expect(muestra).toHaveAttribute('aria-hidden', 'true');
    expect(muestra.querySelector('rect')).toHaveAttribute('fill', '#1D4ED8');
  });

  it('[US-13 CA-13] "Ver datos" muestra y oculta la tabla alternativa', async () => {
    const user = userEvent.setup();
    renderCard();

    const boton = screen.getByRole('button', { name: 'Ver datos' });
    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await user.click(boton);

    expect(boton).toHaveAttribute('aria-expanded', 'true');
    expect(boton).toHaveAccessibleName('Ocultar datos');
    const tabla = screen.getByRole('table', { name: 'Por categoría' });
    expect(within(tabla).getByRole('columnheader', { name: 'Nombre' })).toHaveAttribute(
      'scope',
      'col',
    );
    expect(within(tabla).getByRole('columnheader', { name: 'Solicitudes' })).toBeInTheDocument();
    expect(within(tabla).getByRole('rowheader', { name: 'Redes y Wi-Fi' })).toHaveAttribute(
      'scope',
      'row',
    );
    expect(within(tabla).getByRole('cell', { name: '30' })).toBeInTheDocument();

    await user.click(boton);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('[US-13 CA-13] "Ver datos" funciona con el teclado', async () => {
    const user = userEvent.setup();
    renderCard();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Ver datos' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('[US-13 CA-13] la tabla incluye la columna de porcentaje cuando se pide', async () => {
    const user = userEvent.setup();
    renderCard({ mostrarPorcentaje: true });

    await user.click(screen.getByRole('button', { name: 'Ver datos' }));

    const tabla = screen.getByRole('table');
    expect(within(tabla).getByRole('columnheader', { name: 'Porcentaje' })).toBeInTheDocument();
    expect(within(tabla).getByRole('cell', { name: '75 %' })).toBeInTheDocument();
  });

  it('[US-13 CA-11] con datos vacíos muestra un estado vacío y no el gráfico, la leyenda ni la tabla', () => {
    renderCard({ items: [] });

    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
    expect(screen.queryByTestId('grafico')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ver datos' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Por categoría' })).toBeInTheDocument();
  });

  it('[US-13 CA-11] tolera items null o undefined como vacío', () => {
    const { unmount } = renderCard({ items: null });
    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
    unmount();

    renderCard({ items: undefined });
    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
  });

  it('[US-13 CA-5] permite nombrar la columna de valores', async () => {
    const user = userEvent.setup();
    renderCard({ etiquetaValor: 'Asignadas' });

    await user.click(screen.getByRole('button', { name: 'Ver datos' }));

    expect(screen.getByRole('columnheader', { name: 'Asignadas' })).toBeInTheDocument();
  });

  it('[US-13 CA-13] la leyenda se nombra con el título del gráfico', () => {
    renderCard({ titulo: 'Por prioridad' });

    expect(screen.getByRole('list', { name: 'Leyenda: Por prioridad' })).toBeInTheDocument();
  });

  it('[US-13 CA-11] si todos los valores son 0 muestra el estado vacío, no un gráfico en blanco', () => {
    renderCard({
      items: [
        { nombre: 'BAJA', valor: 0, color: '#047857' },
        { nombre: 'ALTA', valor: 0, color: '#B45309' },
      ],
    });

    expect(screen.getByText('Sin datos para mostrar.')).toBeInTheDocument();
    expect(screen.queryByTestId('grafico')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ver datos' })).not.toBeInTheDocument();
  });

  it('[US-13 CA-13] el nivel del título es configurable y por defecto h3', () => {
    const { unmount } = renderCard();
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    unmount();

    renderCard({ nivelTitulo: 2 });
    expect(screen.getByRole('heading', { level: 2, name: 'Por categoría' })).toBeInTheDocument();
  });

  it('[US-13 CA-13] un nivel de título inválido cae a h3', () => {
    renderCard({ nivelTitulo: 9 });

    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('[US-13 CA-5] tolera nombres repetidos sin advertencias de claves duplicadas', async () => {
    const user = userEvent.setup();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderCard({
      items: [
        { nombre: 'Redes', valor: 3, color: '#1D4ED8' },
        { nombre: 'Redes', valor: 2, color: '#047857' },
      ],
    });
    await user.click(screen.getByRole('button', { name: 'Ver datos' }));

    expect(screen.getAllByRole('rowheader', { name: 'Redes' })).toHaveLength(2);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('[US-13 CA-13] el encabezado de la columna de valores se alinea con sus valores (a la derecha)', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole('button', { name: 'Ver datos' }));

    expect(screen.getByRole('columnheader', { name: 'Solicitudes' })).toHaveClass(
      'chart-card__col-numerica',
    );
    expect(screen.getByRole('cell', { name: '30' })).toHaveClass('chart-card__col-numerica');
    expect(css).toMatch(/\.chart-card__col-numerica\s*{[^}]*text-align:\s*right/);
  });
});
