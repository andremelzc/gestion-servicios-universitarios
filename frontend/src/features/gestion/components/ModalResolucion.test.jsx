import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { solicitudDetalleEjemplo } from '../../../test/handlers/gestion.js';
import ModalResolucion from './ModalResolucion.jsx';

const solicitud = { ...solicitudDetalleEjemplo, estado: { codigo: 'EN_ATENCION' } };
const INFORME = 'Se reemplazó el cable HDMI dañado.';

const archivo = (nombre = 'foto.png', tipo = 'image/png', tamano = 1024) =>
  new File([new Uint8Array(tamano)], nombre, { type: tipo });

function renderModal(props = {}) {
  const todas = { isOpen: true, solicitud, onClose: vi.fn(), onSubmit: vi.fn(), ...props };
  render(<ModalResolucion {...todas} />);
  return todas;
}

const campoInforme = () => screen.getByRole('textbox', { name: /Informe técnico/ });
const entradaArchivos = () => screen.getByLabelText(/Evidencia de la solución/);
const marcarResuelta = () =>
  userEvent.click(screen.getByRole('button', { name: 'Marcar resuelta' }));
// `applyAccept: false`: user-event filtra por `accept`; la validación de tipo es la del componente.
const adjuntar = (...archivos) =>
  userEvent.setup({ applyAccept: false }).upload(entradaArchivos(), archivos);

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:prueba');
  URL.revokeObjectURL = vi.fn();
});

describe('ModalResolucion', () => {
  it('[US-10 CA-10] muestra título, resumen y los campos obligatorios con su ayuda', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Resolver SOL-2026-0150' })).toBeInTheDocument();
    expect(screen.getByText('Proyector sin imagen')).toBeInTheDocument();
    expect(campoInforme()).toHaveAttribute('maxlength', '2000');
    expect(campoInforme()).toBeRequired();
    expect(screen.getByText('0 de 2000 caracteres (mínimo 20)')).toBeInTheDocument();
    expect(entradaArchivos()).toBeInTheDocument();
  });

  it('[US-10 CA-10] con informe y una evidencia envía {informe, archivos} con el informe recortado', async () => {
    const { onSubmit } = renderModal();
    const foto = archivo();

    await userEvent.type(campoInforme(), `  ${INFORME}  `);
    await adjuntar(foto);
    await marcarResuelta();

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ informe: INFORME, archivos: [foto] });
  });

  it('[US-10 CA-10] admite hasta 3 evidencias y no más', async () => {
    const { onSubmit } = renderModal();

    await userEvent.type(campoInforme(), INFORME);
    await adjuntar(archivo('a.png'), archivo('b.png'), archivo('c.pdf', 'application/pdf'));
    await adjuntar(archivo('d.png'));
    await marcarResuelta();

    expect(screen.getByRole('alert')).toHaveTextContent('Puedes adjuntar como máximo 3 archivos.');
    expect(onSubmit.mock.calls[0][0].archivos).toHaveLength(3);
  });

  it('[US-10 CA-11] informe de menos de 20 caracteres: no envía, avisa en el campo y lo enfoca', async () => {
    const { onSubmit } = renderModal();
    await userEvent.type(campoInforme(), 'Listo');
    await adjuntar(archivo());

    await marcarResuelta();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(campoInforme()).toBeInvalid();
    expect(campoInforme()).toHaveAccessibleDescription(
      expect.stringContaining('El informe debe tener al menos 20 caracteres.'),
    );
    expect(campoInforme()).toHaveFocus();
  });

  it('[US-10 CA-11] cuenta el informe recortado: los espacios no valen', async () => {
    const { onSubmit } = renderModal();
    await userEvent.type(campoInforme(), ' '.repeat(25));
    await adjuntar(archivo());

    await marcarResuelta();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(campoInforme()).toBeInvalid();
  });

  it('[US-10 CA-11] sin evidencia: no envía, avisa y lleva el foco a la entrada de archivos', async () => {
    const { onSubmit } = renderModal();
    await userEvent.type(campoInforme(), INFORME);

    await marcarResuelta();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(entradaArchivos()).toBeInvalid();
    expect(entradaArchivos()).toHaveAccessibleDescription(
      expect.stringContaining('Adjunta al menos una evidencia de la solución.'),
    );
    expect(entradaArchivos()).toHaveFocus();
  });

  it('[US-10 CA-11] si faltan ambos, enfoca primero el informe', async () => {
    renderModal();

    await marcarResuelta();

    expect(campoInforme()).toBeInvalid();
    expect(entradaArchivos()).toBeInvalid();
    expect(campoInforme()).toHaveFocus();
  });

  it('[US-10 CA-11] el aviso del informe desaparece al corregirlo', async () => {
    renderModal();
    await marcarResuelta();
    expect(campoInforme()).toBeInvalid();

    await userEvent.type(campoInforme(), INFORME);

    expect(campoInforme()).toBeValid();
  });

  it('[US-06 CA-4] un archivo inválido (tipo o tamaño) bloquea el envío', async () => {
    const { onSubmit } = renderModal();
    await userEvent.type(campoInforme(), INFORME);
    await adjuntar(archivo('notas.txt', 'text/plain'));

    await marcarResuelta();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Solo se permiten imágenes JPG, PNG o archivos PDF.',
    );
    expect(entradaArchivos()).toBeInvalid();
  });

  it('[UX §8] el foco inicial queda en el informe y Esc o Cancelar cierran', async () => {
    const { onClose } = renderModal();
    expect(campoInforme()).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('[UX §2.4] mientras envía deshabilita acciones y archivos y no se cierra con Esc', async () => {
    const { onClose } = renderModal({ isSubmitting: true });

    expect(screen.getByRole('button', { name: 'Resolviendo…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(entradaArchivos()).toBeDisabled();
    expect(campoInforme()).toHaveAttribute('readonly');
    await userEvent.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
  });

  it('[US-10 CA-11] 400 con errores por campo del servidor: los asocia y enfoca el primero', () => {
    renderModal({
      error: {
        status: 400,
        errores: {
          informe: 'El informe debe contener al menos 20 caracteres.',
          archivos: 'Falta la evidencia.',
        },
      },
    });

    expect(campoInforme()).toHaveAccessibleDescription(
      expect.stringContaining('El informe debe contener al menos 20 caracteres.'),
    );
    expect(entradaArchivos()).toHaveAccessibleDescription(
      expect.stringContaining('Falta la evidencia.'),
    );
    expect(campoInforme()).toHaveFocus();
  });

  it('[US-10 CA-11] 400 solo en archivos: el foco va a la entrada de archivos', () => {
    renderModal({ error: { status: 400, errores: { archivos: 'Falta la evidencia.' } } });

    expect(entradaArchivos()).toHaveFocus();
  });

  it('[US-10 CA-11] 400 sin campos muestra el detalle en una alerta', () => {
    renderModal({ error: { status: 400, detail: 'Debe adjuntar evidencia.', errores: null } });

    expect(screen.getByRole('alert')).toHaveTextContent('Debe adjuntar evidencia.');
  });

  it('[US-10 CA-12] 409 de transición inválida muestra el microcopy de UX §9', () => {
    renderModal({
      error: { status: 409, tipo: 'transicion-invalida', detail: 'x', errores: null },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Esta solicitud ya cambió de estado.');
  });

  it('[US-10] 413 muestra el detalle del servidor', () => {
    renderModal({ error: { status: 413, detail: 'Archivo demasiado grande.', errores: null } });

    expect(screen.getByRole('alert')).toHaveTextContent('Archivo demasiado grande.');
  });

  it('[US-10] 403 muestra el microcopy de UX §9', () => {
    renderModal({ error: { status: 403, detail: 'x', errores: null } });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No tienes permiso para realizar esta acción.',
    );
  });

  it('[UX §8] sin solicitud o cerrado no renderiza nada ni falla', () => {
    renderModal({ solicitud: null });
    renderModal({ isOpen: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('[UX §8] al cerrar y reabrir el formulario empieza vacío', async () => {
    const props = { onClose: vi.fn(), onSubmit: vi.fn() };
    const { rerender } = render(<ModalResolucion isOpen solicitud={solicitud} {...props} />);
    await userEvent.type(campoInforme(), INFORME);

    rerender(<ModalResolucion isOpen={false} solicitud={solicitud} {...props} />);
    rerender(<ModalResolucion isOpen solicitud={solicitud} {...props} />);

    expect(campoInforme()).toHaveValue('');
  });
});
