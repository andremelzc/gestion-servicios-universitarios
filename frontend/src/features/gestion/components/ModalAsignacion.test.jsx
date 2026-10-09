import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ModalAsignacion from './ModalAsignacion.jsx';

const solicitud = {
  id: 150,
  codigo: 'SOL-2026-0150',
  titulo: 'Proyector sin imagen',
  idArea: 1,
  idPrioridad: 3,
};

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
  const base = {
    isOpen: true,
    solicitud,
    tecnicos,
    prioridades,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };
  const todas = { ...base, ...props };
  render(<ModalAsignacion {...todas} />);
  return todas;
}

const selectorTecnico = () => screen.getByRole('combobox', { name: 'Técnico' });
const selectorPrioridad = () => screen.getByRole('combobox', { name: 'Prioridad definitiva' });
const campoNota = () => screen.getByRole('textbox', { name: 'Nota (opcional)' });

describe('ModalAsignacion', () => {
  it('[US-08 CA-1] muestra la solicitud y lista cada técnico con su carga escrita en texto', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Asignar SOL-2026-0150' })).toBeInTheDocument();
    expect(screen.getByText('Proyector sin imagen')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Carlos Ruiz · 3 en curso' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Lucía Vega · 6 en curso' })).toBeInTheDocument();
  });

  it('[US-08 CA-4] no permite elegir técnicos inactivos ni de otra área y lo dice en texto', () => {
    renderModal();

    expect(screen.getByRole('option', { name: 'Marta Paz · inactivo' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Raúl Soto · otra área' })).toBeDisabled();
  });

  it('[US-08 CA-1] envía técnico, prioridad y nota; la prioridad parte de la actual', async () => {
    const { onSubmit } = renderModal();
    expect(selectorPrioridad()).toHaveValue('3');

    await userEvent.selectOptions(selectorPrioridad(), '2');
    await userEvent.selectOptions(selectorTecnico(), '15');
    await userEvent.type(campoNota(), ' Urgente ');
    expect(campoNota()).toHaveAttribute('maxlength', '255');
    expect(screen.getByText('9/255')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Asignar' }));

    expect(onSubmit).toHaveBeenCalledWith({ idTecnico: 15, idPrioridad: 2, nota: 'Urgente' });
  });

  it('[US-08 CA-1] sin lista de prioridades no muestra el selector ni envía idPrioridad', async () => {
    const { onSubmit } = renderModal({ prioridades: [] });

    await userEvent.selectOptions(selectorTecnico(), '14');
    await userEvent.click(screen.getByRole('button', { name: 'Asignar' }));

    expect(screen.queryByLabelText('Prioridad definitiva')).not.toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledWith({
      idTecnico: 14,
      idPrioridad: undefined,
      nota: undefined,
    });
  });

  it('[US-08 CA-1] exige un técnico: no envía, avisa en el campo y lleva el foco a él', async () => {
    const { onSubmit } = renderModal();

    await userEvent.click(screen.getByRole('button', { name: 'Asignar' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(selectorTecnico()).toBeInvalid();
    expect(selectorTecnico()).toHaveAccessibleDescription('Selecciona un técnico para asignar.');
    expect(selectorTecnico()).toHaveFocus();
  });

  it('[UX §8] el foco inicial queda en el primer campo y Esc o Cancelar cierran', async () => {
    const { onClose } = renderModal();
    expect(selectorPrioridad()).toHaveFocus();

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

  it('[US-08 CA-4] 400 con errores por campo: los asocia al técnico y a la nota', () => {
    renderModal({
      error: {
        status: 400,
        detail: 'Hay campos con errores.',
        errores: { idTecnico: 'El técnico no es del área.', nota: 'La nota no admite HTML.' },
        traceId: 'abc',
      },
    });

    expect(selectorTecnico()).toHaveAccessibleDescription('El técnico no es del área.');
    expect(campoNota()).toHaveAccessibleDescription(
      expect.stringContaining('La nota no admite HTML.'),
    );
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

  it('[US-08 CA-3] 409 muestra el microcopy de UX §9 en una alerta', () => {
    renderModal({ error: { status: 409, detail: 'texto del servidor', errores: null } });

    expect(screen.getByRole('alert')).toHaveTextContent('Esta solicitud ya cambió de estado.');
  });
});
