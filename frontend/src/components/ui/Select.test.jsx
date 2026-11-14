import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Select from './Select.jsx';

function Ejemplo({ inicial = '', alCambiar = () => {}, deshabilitado = false }) {
  const [valor, setValor] = useState(inicial);
  return (
    <>
      <label htmlFor="rol">Rol</label>
      <Select
        id="rol"
        name="rol"
        value={valor}
        disabled={deshabilitado}
        onChange={(e) => {
          alCambiar(e.target.value);
          setValor(e.target.value);
        }}
      >
        <option value="">Selecciona un rol</option>
        <option value="ADMIN">Administrador</option>
        <option value="TECNICO">Técnico</option>
        <option value="SUPERVISOR" disabled>
          Supervisor
        </option>
      </Select>
      <button type="button">Otro</button>
    </>
  );
}

const combo = () => screen.getByRole('combobox', { name: 'Rol' });

describe('Select', () => {
  it('muestra el placeholder y se etiqueta con el label', () => {
    render(<Ejemplo />);

    expect(combo()).toHaveTextContent('Selecciona un rol');
    expect(combo()).toHaveAttribute('aria-expanded', 'false');
  });

  it('abre la lista, elige con el ratón y notifica el valor', async () => {
    const alCambiar = vi.fn();
    const usuario = userEvent.setup();
    render(<Ejemplo alCambiar={alCambiar} />);

    await usuario.click(combo());
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(4);

    await usuario.click(screen.getByRole('option', { name: 'Técnico' }));

    expect(alCambiar).toHaveBeenCalledWith('TECNICO');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(combo()).toHaveTextContent('Técnico');
    expect(combo()).toHaveFocus();
  });

  it('navega con el teclado, salta las opciones deshabilitadas y elige con Enter', async () => {
    const alCambiar = vi.fn();
    const usuario = userEvent.setup();
    render(<Ejemplo alCambiar={alCambiar} />);
    combo().focus();

    await usuario.keyboard('{ArrowDown}'); // abre con la primera opción activa
    expect(combo()).toHaveAttribute('aria-expanded', 'true');
    await usuario.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    // La última opción está deshabilitada: la activa se queda en "Técnico".
    expect(combo()).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Técnico' }).id,
    );
    await usuario.keyboard('{Enter}');

    expect(alCambiar).toHaveBeenCalledWith('TECNICO');
  });

  it('Esc cierra la lista sin cambiar el valor', async () => {
    const alCambiar = vi.fn();
    const usuario = userEvent.setup();
    render(<Ejemplo alCambiar={alCambiar} />);

    await usuario.click(combo());
    await usuario.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(alCambiar).not.toHaveBeenCalled();
  });

  it('un clic fuera cierra la lista', async () => {
    const usuario = userEvent.setup();
    render(<Ejemplo />);

    await usuario.click(combo());
    await usuario.click(screen.getByRole('button', { name: 'Otro' }));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('escribir una letra salta a la opción que empieza con ella', async () => {
    const alCambiar = vi.fn();
    const usuario = userEvent.setup();
    render(<Ejemplo alCambiar={alCambiar} />);
    combo().focus();

    await usuario.keyboard('t'); // cerrado: elige directamente

    expect(alCambiar).toHaveBeenCalledWith('TECNICO');
  });

  it('no se abre si está deshabilitado', async () => {
    const usuario = userEvent.setup();
    render(<Ejemplo deshabilitado />);

    await usuario.click(combo());

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
