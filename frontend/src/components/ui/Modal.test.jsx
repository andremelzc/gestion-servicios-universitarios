import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Modal from './Modal.jsx';

function Ejemplo({ onClose = () => {} }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}>
        Abrir
      </button>
      <Modal
        isOpen={abierto}
        titulo="Asignar SOL-2026-0150"
        onClose={() => {
          onClose();
          setAbierto(false);
        }}
      >
        <input aria-label="Primero" />
        <button type="button">Medio</button>
        <button type="button">Último</button>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('[UX §8] no renderiza nada mientras está cerrado', () => {
    render(
      <Modal isOpen={false} titulo="Título" onClose={() => {}}>
        contenido
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('[UX §8] expone un diálogo modal con nombre accesible tomado del título', () => {
    render(
      <Modal isOpen titulo="Asignar SOL-2026-0150" onClose={() => {}}>
        contenido
      </Modal>,
    );

    const dialogo = screen.getByRole('dialog', { name: 'Asignar SOL-2026-0150' });
    expect(dialogo).toHaveAttribute('aria-modal', 'true');
  });

  it('[UX §8] lleva el foco inicial al primer control del contenido', async () => {
    render(<Ejemplo />);

    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    expect(screen.getByLabelText('Primero')).toHaveFocus();
  });

  it('[UX §8] Tab atrapa el foco: del último control vuelve al primero', async () => {
    render(<Ejemplo />);
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    screen.getByRole('button', { name: 'Último' }).focus();
    await userEvent.tab();

    expect(screen.getByLabelText('Primero')).toHaveFocus();
  });

  it('[UX §8] Shift+Tab atrapa el foco: del primer control salta al último', async () => {
    render(<Ejemplo />);
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    await userEvent.tab({ shift: true });

    expect(screen.getByRole('button', { name: 'Último' })).toHaveFocus();
  });

  it('[UX §8] Esc invoca onClose', async () => {
    const onClose = vi.fn();
    render(<Ejemplo onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('[UX §8] al cerrar devuelve el foco al elemento que lo abrió', async () => {
    render(<Ejemplo />);
    const disparador = screen.getByRole('button', { name: 'Abrir' });
    await userEvent.click(disparador);

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(disparador).toHaveFocus();
  });
});
