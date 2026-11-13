import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ConfirmarDesactivacion from './ConfirmarDesactivacion.jsx';

const abrir = (props = {}) => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmarDesactivacion
      isOpen
      nombre="ALTA"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onConfirm, onCancel };
};

describe('ConfirmarDesactivacion', () => {
  it('[UX §9] es un alertdialog con el mensaje de confirmación', () => {
    abrir();

    const dialogo = screen.getByRole('alertdialog', { name: 'Desactivar ALTA' });
    expect(dialogo).toHaveAccessibleDescription(
      'ALTA dejará de aparecer en los formularios. Los registros existentes no se modifican.',
    );
  });

  it('el foco inicial va a Cancelar (la acción segura)', () => {
    abrir();

    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });

  it('Desactivar confirma y Esc cancela', async () => {
    const { onConfirm, onCancel } = abrir();

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('mantiene el foco dentro del diálogo en ambas direcciones', async () => {
    abrir();
    const cancelar = screen.getByRole('button', { name: 'Cancelar' });
    const confirmar = screen.getByRole('button', { name: 'Desactivar' });

    expect(cancelar).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(confirmar).toHaveFocus();
    await userEvent.tab();
    expect(cancelar).toHaveFocus();
  });

  it('muestra el error del servidor y bloquea los botones mientras guarda', () => {
    abrir({ error: 'No se pudo desactivar.', isSaving: true });

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo desactivar.');
    expect(screen.getByRole('button', { name: 'Desactivando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });

  it('mantiene el foco en el diálogo durante el guardado y lo devuelve a Cancelar al terminar', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const props = { isOpen: true, nombre: 'ALTA', onConfirm, onCancel };
    const { rerender } = render(<ConfirmarDesactivacion {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Desactivar' }));
    rerender(<ConfirmarDesactivacion {...props} isSaving />);

    const estado = screen.getByRole('status');
    expect(estado).toHaveTextContent('Desactivando…');
    expect(estado).toHaveFocus();
    await userEvent.tab();
    expect(estado).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(onCancel).not.toHaveBeenCalled();

    rerender(<ConfirmarDesactivacion {...props} error="No se pudo desactivar." />);
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });
});
