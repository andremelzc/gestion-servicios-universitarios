import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AccionesFila from './AccionesFila.jsx';

describe('AccionesFila (RN-14)', () => {
  it('una fila activa ofrece Editar y Desactivar con el nombre en la etiqueta accesible', async () => {
    const onEditar = vi.fn();
    const onDesactivar = vi.fn();
    render(
      <AccionesFila activo nombre="Mobiliario" onEditar={onEditar} onDesactivar={onDesactivar} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Editar Mobiliario' }));
    await userEvent.click(screen.getByRole('button', { name: 'Desactivar Mobiliario' }));

    expect(onEditar).toHaveBeenCalledOnce();
    expect(onDesactivar).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: /Reactivar/ })).toBeNull();
  });

  it('una fila inactiva solo ofrece Reactivar', async () => {
    const onReactivar = vi.fn();
    render(<AccionesFila activo={false} nombre="Mobiliario" onReactivar={onReactivar} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reactivar Mobiliario' }));

    expect(onReactivar).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: /Editar|Desactivar/ })).toBeNull();
  });

  it('mientras se guarda, Reactivar usa aria-disabled: conserva el foco y no actúa', async () => {
    const onReactivar = vi.fn();
    render(<AccionesFila activo={false} nombre="Mobiliario" isSaving onReactivar={onReactivar} />);
    const boton = screen.getByRole('button', { name: 'Reactivar Mobiliario' });

    expect(boton).toHaveAttribute('aria-disabled', 'true');
    expect(boton).not.toBeDisabled();
    boton.focus();
    expect(boton).toHaveFocus();
    await userEvent.click(boton);
    await userEvent.keyboard('{Enter}');

    expect(onReactivar).not.toHaveBeenCalled();
    expect(boton).toHaveFocus();
  });
});
