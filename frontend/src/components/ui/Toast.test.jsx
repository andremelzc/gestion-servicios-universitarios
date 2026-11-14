import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Toast from './Toast.jsx';

afterEach(() => vi.useRealTimers());

describe('Toast', () => {
  it('sin mensaje la región existe pero está vacía (para que el cambio se anuncie después)', () => {
    render(<Toast mensaje="" />);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('muestra el mensaje en una región aria-live educada', () => {
    render(<Toast mensaje="Área creada" />);

    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('Área creada');
  });

  it('el botón de cerrar lo oculta, y un mensaje distinto lo muestra de nuevo', async () => {
    const usuario = userEvent.setup();
    const { rerender } = render(<Toast mensaje="Usuario creado" />);

    await usuario.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    rerender(<Toast mensaje="Usuario actualizado" />);
    expect(screen.getByRole('status')).toHaveTextContent('Usuario actualizado');
  });

  it('un aviso de éxito se descarta solo a los 6 segundos', () => {
    vi.useFakeTimers();
    render(<Toast mensaje="Guardado" />);
    expect(screen.getByRole('status')).toHaveTextContent('Guardado');

    act(() => vi.advanceTimersByTime(5900));
    expect(screen.getByRole('status')).toHaveTextContent('Guardado');
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('un error usa role="alert" y no se descarta solo', () => {
    vi.useFakeTimers();
    render(<Toast tipo="error" mensaje="No se pudo guardar" />);

    act(() => vi.advanceTimersByTime(60000));

    const region = screen.getByRole('alert');
    expect(region).toHaveAttribute('aria-live', 'assertive');
    expect(region).toHaveTextContent('No se pudo guardar');
  });
});
