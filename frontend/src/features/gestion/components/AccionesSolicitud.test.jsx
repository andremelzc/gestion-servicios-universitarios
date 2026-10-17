import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { solicitudDetalleEjemplo } from '../../../test/handlers/gestion.js';
import AccionesSolicitud from './AccionesSolicitud.jsx';

function renderAcciones(props = {}) {
  const todas = { acciones: ['RESOLVER', 'COMENTAR'], onAccion: vi.fn(), ...props };
  render(<AccionesSolicitud {...todas} />);
  return todas;
}

describe('AccionesSolicitud', () => {
  it('[US-11 CA-13] muestra solo las acciones que declara el backend', () => {
    renderAcciones({ acciones: solicitudDetalleEjemplo.accionesPermitidas });

    expect(screen.getByRole('button', { name: 'Asignar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Comentar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resolver' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cerrar/i })).not.toBeInTheDocument();
  });

  it('asigna una etiqueta en español a cada código de api-rest §3.2', () => {
    renderAcciones({
      acciones: ['EVALUAR', 'ASIGNAR', 'INICIAR_ATENCION', 'RESOLVER', 'COMENTAR', 'CERRAR'],
    });

    expect(screen.getByRole('button', { name: 'Evaluar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Asignar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar atención' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resolver' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Comentar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar solicitud' })).toBeInTheDocument();
  });

  it('ordena las acciones de forma estable sin importar el orden recibido', () => {
    renderAcciones({ acciones: ['CERRAR', 'COMENTAR', 'RESOLVER'] });

    const botones = screen.getAllByRole('button');
    expect(botones[0]).toHaveAccessibleName('Resolver');
    expect(botones[1]).toHaveAccessibleName('Comentar');
    expect(botones[2]).toHaveAccessibleName('Cerrar solicitud');
  });

  it('ignora códigos desconocidos, repetidos o inválidos sin fallar', () => {
    renderAcciones({ acciones: ['VOLAR', 'RESOLVER', 'RESOLVER', null, 42, undefined] });

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Resolver' })).toBeInTheDocument();
  });

  it.each([undefined, null, [], ['VOLAR'], 'RESOLVER'])(
    'no dibuja nada con acciones %j',
    (acciones) => {
      const { container } = render(<AccionesSolicitud acciones={acciones} onAccion={vi.fn()} />);

      expect(container).toBeEmptyDOMElement();
    },
  );

  it('invoca onAccion con el código al pulsar una acción', async () => {
    const { onAccion } = renderAcciones();

    await userEvent.click(screen.getByRole('button', { name: 'Resolver' }));

    expect(onAccion).toHaveBeenCalledExactlyOnceWith('RESOLVER');
  });

  it('agrupa las acciones con un nombre accesible', () => {
    renderAcciones();

    const grupo = screen.getByRole('group', { name: 'Acciones de la solicitud' });
    expect(within(grupo).getAllByRole('button')).toHaveLength(2);
  });

  describe('Cerrar', () => {
    it('pide confirmación y no cierra hasta confirmar', async () => {
      const { onAccion } = renderAcciones({ acciones: ['CERRAR'] });

      await userEvent.click(screen.getByRole('button', { name: 'Cerrar solicitud' }));

      const dialogo = screen.getByRole('alertdialog', { name: 'Cerrar solicitud' });
      expect(dialogo).toBeInTheDocument();
      expect(onAccion).not.toHaveBeenCalled();

      await userEvent.click(within(dialogo).getByRole('button', { name: 'Sí, cerrar solicitud' }));

      expect(onAccion).toHaveBeenCalledExactlyOnceWith('CERRAR');
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('permite cancelar sin cerrar y devuelve el foco al botón', async () => {
      const { onAccion } = renderAcciones({ acciones: ['CERRAR'] });
      const boton = screen.getByRole('button', { name: 'Cerrar solicitud' });

      await userEvent.click(boton);
      await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(onAccion).not.toHaveBeenCalled();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(boton).toHaveFocus();
    });

    it('usa un texto neutro respecto al rol y enfoca "Cancelar" al abrir', async () => {
      renderAcciones({ acciones: ['CERRAR'] });

      await userEvent.click(screen.getByRole('button', { name: 'Cerrar solicitud' }));

      expect(
        screen.getByText(
          'La solicitud pasará a Cerrada y ya no admitirá cambios. Esta acción no se puede deshacer.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    });

    it('no confirma el cierre si otra acción empezó con la confirmación abierta', async () => {
      const props = { acciones: ['CERRAR'], onAccion: vi.fn() };
      const { rerender } = render(<AccionesSolicitud {...props} />);
      await userEvent.click(screen.getByRole('button', { name: 'Cerrar solicitud' }));

      rerender(<AccionesSolicitud {...props} accionEnCurso="COMENTAR" />);
      const confirmar = screen.getByRole('button', { name: 'Sí, cerrar solicitud' });
      expect(confirmar).toHaveAttribute('aria-disabled', 'true');
      await userEvent.click(confirmar);

      expect(props.onAccion).not.toHaveBeenCalled();
    });

    it('si CERRAR desaparece tras confirmar, el foco queda en el grupo y no en body', async () => {
      const props = { acciones: ['RESOLVER', 'CERRAR'], onAccion: vi.fn() };
      const { rerender } = render(<AccionesSolicitud {...props} />);
      await userEvent.click(screen.getByRole('button', { name: 'Cerrar solicitud' }));
      await userEvent.click(screen.getByRole('button', { name: 'Sí, cerrar solicitud' }));

      rerender(<AccionesSolicitud {...props} acciones={['COMENTAR']} />);

      expect(screen.getByRole('group', { name: 'Acciones de la solicitud' })).toHaveFocus();
    });

    it('Esc cierra la confirmación sin cerrar la solicitud', async () => {
      const { onAccion } = renderAcciones({ acciones: ['CERRAR'] });

      await userEvent.click(screen.getByRole('button', { name: 'Cerrar solicitud' }));
      await userEvent.keyboard('{Escape}');

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(onAccion).not.toHaveBeenCalled();
    });

    it('se distingue visualmente y con un símbolo, no solo con color', () => {
      renderAcciones({ acciones: ['RESOLVER', 'CERRAR'] });

      const cerrar = screen.getByRole('button', { name: 'Cerrar solicitud' });
      expect(cerrar).toHaveClass('acciones-solicitud__boton--destructiva');
      expect(cerrar.querySelector('[aria-hidden="true"]')).toHaveTextContent('⊗');
      expect(cerrar).toHaveAccessibleName('Cerrar solicitud');
      expect(screen.getByRole('button', { name: 'Resolver' })).not.toHaveClass(
        'acciones-solicitud__boton--destructiva',
      );
    });
  });

  describe('acción en curso', () => {
    it('marca todos los botones con aria-disabled y no dispara más acciones', async () => {
      const { onAccion } = renderAcciones({ accionEnCurso: 'RESOLVER' });

      const resolver = screen.getByRole('button', { name: 'Resolver' });
      const comentar = screen.getByRole('button', { name: 'Comentar' });
      expect(resolver).toHaveAttribute('aria-disabled', 'true');
      expect(comentar).toHaveAttribute('aria-disabled', 'true');
      expect(resolver).toHaveAttribute('aria-busy', 'true');
      expect(comentar).not.toHaveAttribute('aria-busy');

      await userEvent.click(resolver);
      await userEvent.click(comentar);

      expect(onAccion).not.toHaveBeenCalled();
    });

    it.each(['{Enter}', ' '])(
      'la tecla %j sobre un botón aria-disabled no dispara nada',
      async (tecla) => {
        const { onAccion } = renderAcciones({ accionEnCurso: 'RESOLVER' });

        screen.getByRole('button', { name: 'Comentar' }).focus();
        await userEvent.keyboard(tecla);

        expect(onAccion).not.toHaveBeenCalled();
      },
    );

    it('anuncia el progreso a lectores de pantalla', () => {
      renderAcciones({ accionEnCurso: 'RESOLVER' });

      expect(screen.getByRole('status')).toHaveTextContent('Procesando…');
    });

    it('sin acción en curso los botones quedan activos y sin aviso', () => {
      renderAcciones();

      expect(screen.getByRole('button', { name: 'Resolver' })).not.toHaveAttribute('aria-disabled');
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });

    it('con deshabilitado bloquea las acciones sin marcar ninguna como ocupada', async () => {
      const { onAccion } = renderAcciones({ deshabilitado: true });

      const resolver = screen.getByRole('button', { name: 'Resolver' });
      expect(resolver).toHaveAttribute('aria-disabled', 'true');
      expect(resolver).not.toHaveAttribute('aria-busy');
      await userEvent.click(resolver);

      expect(onAccion).not.toHaveBeenCalled();
    });

    it('no abre la confirmación de cierre mientras otra acción corre', async () => {
      renderAcciones({ acciones: ['CERRAR'], accionEnCurso: 'RESOLVER' });

      await userEvent.click(screen.getByRole('button', { name: 'Cerrar solicitud' }));

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });
});
