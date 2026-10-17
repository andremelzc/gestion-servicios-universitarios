import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { solicitudDetalleEjemplo } from '../../../test/handlers/gestion.js';
import ModalAsignacion from './ModalAsignacion.jsx';

// Forma real de api-rest §3.2: `area` es un objeto y `prioridad` el código ("ALTA").
const solicitud = solicitudDetalleEjemplo;

const tecnicos = [
  { id: 14, nombre: 'Carlos', apellido: 'Ruiz', idArea: 1, activo: true, cargaActual: 3 },
  { id: 15, nombre: 'Lucía', apellido: 'Vega', idArea: 1, activo: true, cargaActual: 6 },
  { id: 16, nombre: 'Marta', apellido: 'Paz', idArea: 1, activo: false, cargaActual: 0 },
  { id: 17, nombre: 'Raúl', apellido: 'Soto', idArea: 2, activo: true, cargaActual: 1 },
];

const prioridades = [
  { id: 2, nombre: 'Media' },
  { id: 3, nombre: 'Alta' },
];

function renderModal(props = {}) {
  const todas = {
    isOpen: true,
    solicitud,
    tecnicos,
    prioridades,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    ...props,
  };
  render(<ModalAsignacion {...todas} />);
  return todas;
}

const selectorTecnico = () => screen.getByRole('combobox', { name: 'Técnico' });
const selectorPrioridad = () => screen.getByRole('combobox', { name: 'Prioridad definitiva' });
const campoNota = () => screen.getByRole('textbox', { name: 'Nota (opcional)' });
const asignar = () => userEvent.click(screen.getByRole('button', { name: 'Asignar' }));

describe('ModalAsignacion', () => {
  it('[US-08 CA-1] muestra la solicitud y lista cada técnico con su carga escrita en texto', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Asignar SOL-2026-0150' })).toBeInTheDocument();
    expect(screen.getByText('Proyector sin imagen')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Carlos Ruiz · 3 en curso' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Lucía Vega · 6 en curso' })).toBeInTheDocument();
  });

  it('[US-08 CA-4] con la forma real de la API deshabilita inactivos y técnicos de otra área', () => {
    renderModal();

    expect(screen.getByRole('option', { name: 'Marta Paz · inactivo' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Raúl Soto · otra área' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Carlos Ruiz · 3 en curso' })).toBeEnabled();
  });

  it('[US-08 CA-8] al reasignar marca al técnico actual como "(actual)" y no se puede elegir', () => {
    renderModal({
      solicitud: { ...solicitud, tecnico: { id: 14, nombre: 'Carlos', apellido: 'Ruiz' } },
    });

    expect(
      screen.getByRole('option', { name: 'Carlos Ruiz · 3 en curso (actual)' }),
    ).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Lucía Vega · 6 en curso' })).toBeEnabled();
  });

  it('[US-08 CA-1] sin tocar la prioridad envía técnico y nota, sin idPrioridad', async () => {
    const { onSubmit } = renderModal();
    expect(selectorPrioridad()).toHaveValue('3');

    await userEvent.selectOptions(selectorTecnico(), '15');
    await userEvent.type(campoNota(), ' Urgente ');
    expect(campoNota()).toHaveAttribute('maxlength', '255');
    expect(screen.getByText('9 de 255 caracteres')).toBeInTheDocument();
    await asignar();

    const enviado = onSubmit.mock.calls[0][0];
    expect(enviado).toEqual({ idTecnico: 15, nota: 'Urgente' });
    expect(enviado).not.toHaveProperty('idPrioridad');
  });

  it('[US-23 CA-6] si cambia la prioridad incluye idPrioridad para que el contenedor evalúe', async () => {
    const { onSubmit } = renderModal();

    await userEvent.selectOptions(selectorPrioridad(), '2');
    await userEvent.selectOptions(selectorTecnico(), '14');
    await asignar();

    expect(onSubmit).toHaveBeenCalledWith({ idTecnico: 14, nota: undefined, idPrioridad: 2 });
  });

  it('[US-23 CA-6] si no puede resolver la prioridad actual muestra un marcador y no elige ninguna', async () => {
    const { onSubmit } = renderModal({ solicitud: { ...solicitud, prioridad: 'DESCONOCIDA' } });

    expect(selectorPrioridad()).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Selecciona una prioridad' })).toBeInTheDocument();
    await userEvent.selectOptions(selectorTecnico(), '14');
    await asignar();

    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('idPrioridad');
  });

  it('[US-08 CA-1] sin lista de prioridades no muestra el selector ni envía idPrioridad', async () => {
    const { onSubmit } = renderModal({ prioridades: [] });

    await userEvent.selectOptions(selectorTecnico(), '14');
    await asignar();

    expect(screen.queryByLabelText('Prioridad definitiva')).not.toBeInTheDocument();
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('idPrioridad');
  });

  it('[US-08 CA-1] exige un técnico: no envía, avisa en el campo y lleva el foco a él', async () => {
    const { onSubmit } = renderModal();
    await userEvent.click(selectorPrioridad());

    await asignar();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(selectorTecnico()).toBeInvalid();
    expect(selectorTecnico()).toHaveAccessibleDescription('Selecciona un técnico para asignar.');
    expect(selectorTecnico()).toHaveFocus();
  });

  it('[UX §8] el foco inicial queda en el técnico y Esc o Cancelar cierran', async () => {
    const { onClose } = renderModal();
    expect(selectorTecnico()).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('[UX §2.4] mientras envía deshabilita el envío y no se cierra con Esc ni Cancelar', async () => {
    const { onClose } = renderModal({ isSubmitting: true });

    expect(screen.getByRole('button', { name: 'Asignando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    await userEvent.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
  });

  it('[US-08 CA-4] 400 con errores por campo: los asocia al técnico y a la nota y enfoca el primero', () => {
    renderModal({
      error: {
        status: 400,
        detail: 'Hay campos con errores.',
        errores: { idTecnico: 'El técnico no es del área.', nota: 'La nota no admite HTML.' },
      },
    });

    expect(selectorTecnico()).toHaveAccessibleDescription('El técnico no es del área.');
    expect(campoNota()).toHaveAccessibleDescription(
      expect.stringContaining('La nota no admite HTML.'),
    );
    expect(selectorTecnico()).toHaveFocus();
  });

  it('[US-08 CA-4] 400 solo con error en la nota: el foco va a la nota', () => {
    renderModal({ error: { status: 400, errores: { nota: 'La nota no admite HTML.' } } });

    expect(campoNota()).toHaveFocus();
  });

  it('[US-08 CA-4] 400 sin errores por campo: muestra el detalle de la regla incumplida', () => {
    renderModal({
      error: {
        status: 400,
        detail: 'El técnico no pertenece al área de la categoría.',
        errores: null,
      },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El técnico no pertenece al área de la categoría.',
    );
  });

  it('[US-08 CA-3] 403 muestra el microcopy de UX §9 en una alerta', () => {
    renderModal({ error: { status: 403, detail: 'texto del servidor', errores: null } });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No tienes permiso para realizar esta acción.',
    );
  });

  it('[US-08 CA-12] 409 de transición inválida muestra el microcopy de UX §9', () => {
    renderModal({
      error: { status: 409, tipo: 'transicion-invalida', detail: 'x', errores: null },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Esta solicitud ya cambió de estado.');
  });

  it('[US-08 CA-4] 409 por regla de negocio muestra el detalle, no el aviso de transición', () => {
    renderModal({
      error: {
        status: 409,
        tipo: 'conflicto',
        detail: 'El técnico no es del área.',
        errores: null,
      },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('El técnico no es del área.');
  });

  it('[UX §8] sin solicitud o cerrado no renderiza nada ni falla', () => {
    renderModal({ solicitud: null });
    renderModal({ isOpen: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
