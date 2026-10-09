import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import KpiCard from './KpiCard.jsx';

describe('KpiCard', () => {
  it('[US-12 CA-1] muestra el título y el valor exacto', () => {
    render(<KpiCard titulo="Registradas" valor={150} />);

    const grupo = screen.getByRole('group', { name: 'Registradas' });
    expect(grupo).toHaveTextContent('150');
  });

  it('[US-12 CA-1] formatea es-PE con un decimal y muestra la unidad', () => {
    render(<KpiCard titulo="% Resueltas" valor={70.5} unidad="%" />);

    const grupo = screen.getByRole('group', { name: '% Resueltas' });
    expect(grupo).toHaveTextContent('70.5');
    expect(grupo).toHaveTextContent('%');
  });

  it('[US-12 CA-11] muestra "—" cuando el valor es null', () => {
    render(<KpiCard titulo="MTTR" valor={null} unidad="h" />);

    const grupo = screen.getByRole('group', { name: 'MTTR' });
    expect(grupo).toHaveTextContent('—');
    expect(grupo).not.toHaveTextContent('null');
    expect(grupo).not.toHaveTextContent('NaN');
  });

  it('[US-12 CA-11] anuncia "Sin datos" a lectores de pantalla cuando no hay valor', () => {
    render(<KpiCard titulo="MTTR" valor={undefined} unidad="h" />);

    expect(screen.getByText('Sin datos')).toBeInTheDocument();
    expect(screen.getByText('—')).toHaveAttribute('aria-hidden', 'true');
  });

  it('[US-12 CA-11] no muestra la unidad cuando no hay valor', () => {
    render(<KpiCard titulo="MTTR" valor={null} unidad="h" />);

    expect(screen.getByRole('group', { name: 'MTTR' })).not.toHaveTextContent(/\bh\b/);
  });

  it('[US-12 CA-11] el cero se muestra como 0, no como "—"', () => {
    render(<KpiCard titulo="Pendientes" valor={0} />);

    const grupo = screen.getByRole('group', { name: 'Pendientes' });
    expect(grupo).toHaveTextContent('0');
    expect(grupo).not.toHaveTextContent('—');
  });

  it('[US-12 CA-13] muestra la descripción y oculta el icono decorativo a lectores de pantalla', () => {
    render(
      <KpiCard
        titulo="Vencidas"
        valor={7}
        descripcion="Pendientes fuera de SLA"
        icono={<svg data-testid="icono" />}
      />,
    );

    expect(screen.getByText('Pendientes fuera de SLA')).toBeInTheDocument();
    expect(screen.getByTestId('icono').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('[US-12 CA-13] no depende del color: título y valor son texto', () => {
    render(<KpiCard titulo="Atendidas" valor={98} />);

    expect(screen.getByText('Atendidas')).toBeVisible();
    expect(screen.getByText('98')).toBeVisible();
  });
});
