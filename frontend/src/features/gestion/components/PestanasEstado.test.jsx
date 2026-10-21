import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import PestanasEstado from './PestanasEstado.jsx';

const pestanas = [
  { id: 'a', nombre: 'Por asignar' },
  { id: 'b', nombre: 'En curso' },
  { id: 'c', nombre: 'Todas' },
];

function Controlado({ onChange = () => {} }) {
  const [activa, setActiva] = useState('a');
  return (
    <PestanasEstado
      pestanas={pestanas}
      activa={activa}
      etiqueta="Estado"
      onChange={(id) => {
        onChange(id);
        setActiva(id);
      }}
    >
      <p>Contenido de {activa}</p>
    </PestanasEstado>
  );
}

describe('PestanasEstado', () => {
  it('expone el patrón WAI-ARIA: tablist, tabs con aria-selected y un tabpanel rotulado', () => {
    render(<Controlado />);
    expect(screen.getByRole('tablist', { name: 'Estado' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Por asignar' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'En curso' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel', { name: 'Por asignar' })).toHaveTextContent(
      'Contenido de a',
    );
  });

  it('solo la pestaña activa está en el orden de tabulación', () => {
    render(<Controlado />);
    expect(screen.getByRole('tab', { name: 'Por asignar' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'En curso' })).toHaveAttribute('tabindex', '-1');
  });

  it('cambia de pestaña con clic', async () => {
    const onChange = vi.fn();
    render(<Controlado onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'En curso' }));
    expect(onChange).toHaveBeenCalledWith('b');
    expect(screen.getByRole('tabpanel', { name: 'En curso' })).toBeInTheDocument();
  });

  it('las flechas, Inicio y Fin mueven la selección y el foco, con vuelta circular', async () => {
    render(<Controlado />);
    await userEvent.tab();
    expect(screen.getByRole('tab', { name: 'Por asignar' })).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'En curso' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'En curso' })).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Todas' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Por asignar' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Todas' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Por asignar' })).toHaveFocus();
  });
});
