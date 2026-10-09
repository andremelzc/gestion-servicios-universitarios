import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useEffect, useRef, useState } from 'react';
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

  it('[UX §8] los extremos del trap ignoran input hidden, tabindex -1, deshabilitados y ocultos', async () => {
    render(
      <Modal isOpen titulo="Extremos" onClose={() => {}}>
        <button type="button">A</button>
        <button type="button">Z</button>
        <input type="hidden" />
        <button type="button" tabIndex={-1}>
          Fuera de Tab
        </button>
        <button type="button" disabled>
          Deshabilitado
        </button>
        <button type="button" style={{ display: 'none' }}>
          Oculto
        </button>
        <button type="button" style={{ visibility: 'hidden' }}>
          Invisible
        </button>
        <button type="button" hidden>
          Con atributo
        </button>
      </Modal>,
    );

    screen.getByRole('button', { name: 'Z' }).focus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'A' })).toHaveFocus();

    await userEvent.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Z' })).toHaveFocus();
  });

  it('[UX §8] un elemento contenteditable cuenta como enfocable en el trap', async () => {
    render(
      <Modal isOpen titulo="Con campo editable" onClose={() => {}}>
        <button type="button">A</button>
        <div contentEditable suppressContentEditableWarning aria-label="Editable">
          texto
        </div>
      </Modal>,
    );

    screen.getByLabelText('Editable').focus();
    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'A' })).toHaveFocus();
  });

  it('[UX §8] con modales anidados Esc y Tab solo afectan al de arriba', async () => {
    const cierraPadre = vi.fn();
    const cierraHijo = vi.fn();
    render(
      <>
        <Modal isOpen titulo="Padre" onClose={cierraPadre}>
          <button type="button">Control del padre</button>
        </Modal>
        <Modal isOpen titulo="Hijo" onClose={cierraHijo}>
          <button type="button">Control del hijo</button>
        </Modal>
      </>,
    );
    const hijo = screen.getByRole('button', { name: 'Control del hijo' });
    expect(hijo).toHaveFocus();

    await userEvent.tab();
    expect(hijo).toHaveFocus();
    await userEvent.keyboard('{Escape}');

    expect(cierraHijo).toHaveBeenCalledTimes(1);
    expect(cierraPadre).not.toHaveBeenCalled();
  });

  it('[UX §8] al cerrar el modal de arriba el de abajo vuelve a atender Esc', () => {
    const cierraPadre = vi.fn();
    const hijo = (abierto) => (
      <Modal isOpen={abierto} titulo="Hijo" onClose={() => {}}>
        <button type="button">h</button>
      </Modal>
    );
    const arbol = (abierto) => (
      <>
        <Modal isOpen titulo="Padre" onClose={cierraPadre}>
          <button type="button">p</button>
        </Modal>
        {hijo(abierto)}
      </>
    );
    const { rerender } = render(arbol(true));
    rerender(arbol(false));

    screen
      .getByRole('button', { name: 'p' })
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(cierraPadre).toHaveBeenCalledTimes(1);
  });

  it('[UX §8] role alertdialog y descripcion asocian aria-describedby', () => {
    render(
      <Modal
        isOpen
        titulo="Cerrar"
        role="alertdialog"
        descripcion="Esta acción no se deshace."
        onClose={() => {}}
      >
        <button type="button">Aceptar</button>
      </Modal>,
    );

    const dialogo = screen.getByRole('alertdialog', { name: 'Cerrar' });
    expect(dialogo).toHaveAccessibleDescription('Esta acción no se deshace.');
  });

  it('[UX §8] closeOnEsc=false ignora Esc', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen titulo="Fijo" closeOnEsc={false} onClose={onClose}>
        <button type="button">Ok</button>
      </Modal>,
    );

    await userEvent.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
  });

  it('[UX §8] initialFocusRef decide el control con el foco inicial', () => {
    const ref = createRef();
    render(
      <Modal isOpen titulo="Inicial" initialFocusRef={ref} onClose={() => {}}>
        <button type="button">Primero</button>
        <button type="button" ref={ref}>
          Elegido
        </button>
      </Modal>,
    );

    expect(screen.getByRole('button', { name: 'Elegido' })).toHaveFocus();
  });

  it('[UX §8] se renderiza en document.body, fuera del árbol del llamador', () => {
    const { container } = render(
      <Modal isOpen titulo="Portal" onClose={() => {}}>
        <button type="button">Ok</button>
      </Modal>,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.getByRole('dialog').closest('body > *')).toBeInTheDocument();
  });

  it('[UX §8] bloquea el scroll del body mientras está abierto y lo restaura al cerrar', () => {
    document.body.style.overflow = 'auto';
    const abierto = (isOpen) => (
      <Modal isOpen={isOpen} titulo="Scroll" onClose={() => {}}>
        <button type="button">Ok</button>
      </Modal>
    );
    const { rerender } = render(abierto(true));
    expect(document.body.style.overflow).toBe('hidden');

    rerender(abierto(false));

    expect(document.body.style.overflow).toBe('auto');
    document.body.style.overflow = '';
  });

  it('[UX §8] returnFocusRef tiene prioridad sobre el disparador al cerrar', async () => {
    const destino = createRef();
    function Caso() {
      const [abierto, setAbierto] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setAbierto(true)}>
            Abrir
          </button>
          <button type="button" ref={destino}>
            Destino
          </button>
          <Modal
            isOpen={abierto}
            titulo="Retorno"
            returnFocusRef={destino}
            onClose={() => setAbierto(false)}
          >
            <button type="button">Ok</button>
          </Modal>
        </>
      );
    }
    render(<Caso />);
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Destino' })).toHaveFocus();
  });

  it('[UX §8] si el disparador ya no está en el DOM, el foco vuelve a <main>', async () => {
    function Caso() {
      const [abierto, setAbierto] = useState(false);
      return (
        <main aria-label="Contenido">
          {!abierto && (
            <button type="button" onClick={() => setAbierto(true)}>
              Abrir
            </button>
          )}
          <Modal isOpen={abierto} titulo="Retorno" onClose={() => setAbierto(false)}>
            <button type="button">Ok</button>
          </Modal>
        </main>
      );
    }
    render(<Caso />);
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('[UX §8] no le quita el foco a un control hijo que ya lo tomó al montarse', () => {
    function Hijo() {
      const ref = useRef(null);
      useEffect(() => ref.current.focus(), []);
      return (
        <>
          <button type="button">Primero</button>
          <input aria-label="Con foco propio" ref={ref} />
        </>
      );
    }
    render(
      <Modal isOpen titulo="Hijo con foco" onClose={() => {}}>
        <Hijo />
      </Modal>,
    );

    expect(screen.getByLabelText('Con foco propio')).toHaveFocus();
  });
});
