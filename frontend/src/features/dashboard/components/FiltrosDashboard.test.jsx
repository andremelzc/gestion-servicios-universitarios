import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FiltrosDashboard from './FiltrosDashboard.jsx';

function llenar(desde, hasta) {
  if (desde !== undefined)
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: desde } });
  if (hasta !== undefined)
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: hasta } });
}

const aplicar = () => userEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

afterEach(() => vi.useRealTimers());

describe('FiltrosDashboard', () => {
  it('[US-12 CA-2] es un formulario con nombre y dos fechas etiquetadas', () => {
    render(<FiltrosDashboard onAplicar={() => {}} />);

    expect(screen.getByRole('search', { name: 'Filtros del dashboard' })).toBeInTheDocument();
    expect(screen.getByLabelText('Desde')).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText('Hasta')).toHaveAttribute('type', 'date');
  });

  it('[US-12 CA-2] la pista describe el rango por defecto y los rangos parciales como los resuelve el backend', () => {
    render(<FiltrosDashboard onAplicar={() => {}} />);

    const pista = screen.getByText(/Sin fechas se muestran los últimos 30 días/);
    expect(pista).toHaveTextContent(
      'Si indicas solo Hasta, se muestran los 30 días que terminan ese día.',
    );
    expect(pista).toHaveTextContent('Si indicas solo Desde, se muestra hasta hoy.');
    expect(screen.getByLabelText('Desde')).toHaveAccessibleDescription(
      expect.stringContaining('últimos 30 días'),
    );
  });

  it('[US-12 CA-2] Aplicar entrega el rango elegido', async () => {
    const alAplicar = vi.fn();
    render(<FiltrosDashboard onAplicar={alAplicar} />);

    llenar('2026-10-01', '2026-10-03');
    await aplicar();

    expect(alAplicar).toHaveBeenCalledWith({ desde: '2026-10-01', hasta: '2026-10-03' });
  });

  it('[US-12 CA-2] sin fechas entrega cadenas vacías (el backend aplica los últimos 30 días)', async () => {
    const alAplicar = vi.fn();
    render(<FiltrosDashboard onAplicar={alAplicar} />);

    await aplicar();

    expect(alAplicar).toHaveBeenCalledWith({ desde: '', hasta: '' });
  });

  it('[US-12 CA-2] acepta un rango de un solo día y rangos con una sola fecha', async () => {
    const alAplicar = vi.fn();
    render(<FiltrosDashboard onAplicar={alAplicar} />);

    llenar('2026-10-03', '2026-10-03');
    await aplicar();
    llenar('2026-10-01', '');
    await aplicar();
    llenar('', '2026-10-03');
    await aplicar();

    expect(alAplicar).toHaveBeenCalledTimes(3);
    expect(alAplicar).toHaveBeenLastCalledWith({ desde: '', hasta: '2026-10-03' });
  });

  it('[US-12 CA-2] ambas fechas tienen max igual a la fecha local de hoy', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // 23:30 locales: con toISOString (UTC) la fecha podría adelantarse un día.
    vi.setSystemTime(new Date(2026, 9, 3, 23, 30));
    render(<FiltrosDashboard onAplicar={() => {}} />);

    expect(screen.getByLabelText('Desde')).toHaveAttribute('max', '2026-10-03');
    expect(screen.getByLabelText('Hasta')).toHaveAttribute('max', '2026-10-03');
  });

  describe('rango inválido (Desde posterior a Hasta)', () => {
    async function enviarInvalido(alAplicar = vi.fn()) {
      render(<FiltrosDashboard onAplicar={alAplicar} />);
      llenar('2026-10-05', '2026-10-01');
      await aplicar();
      return alAplicar;
    }

    it('[US-12 CA-2] no aplica y avisa con una alerta', async () => {
      const alAplicar = await enviarInvalido();

      expect(alAplicar).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent(
        'La fecha inicial no puede ser posterior a la fecha final.',
      );
    });

    it('[US-12 CA-2] marca Desde y Hasta como inválidos y ambos apuntan al error', async () => {
      await enviarInvalido();

      for (const nombre of ['Desde', 'Hasta']) {
        const campo = screen.getByLabelText(nombre);
        expect(campo).toHaveAttribute('aria-invalid', 'true');
        expect(campo).toHaveAccessibleDescription(
          expect.stringContaining('La fecha inicial no puede ser posterior'),
        );
      }
    });

    it('[US-12 CA-2] mueve el foco a Desde tras el envío fallido', async () => {
      await enviarInvalido();

      expect(screen.getByLabelText('Desde')).toHaveFocus();
    });

    it('[US-12 CA-2] al corregir el rango el aviso desaparece y se aplica', async () => {
      const alAplicar = await enviarInvalido();

      llenar('2026-10-01', '2026-10-05');
      await aplicar();

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      for (const nombre of ['Desde', 'Hasta']) {
        expect(screen.getByLabelText(nombre)).not.toHaveAttribute('aria-invalid');
      }
      expect(alAplicar).toHaveBeenCalledWith({ desde: '2026-10-01', hasta: '2026-10-05' });
    });
  });
});

describe('FiltrosDashboard · filtro Área (RN-16, solo ADMIN)', () => {
  const AREAS = [
    { id: 1, nombre: 'Tecnología' },
    { id: 2, nombre: 'Infraestructura' },
  ];

  it('[DASH-15 CA-4] sin la prop `areas` no hay selector de Área', () => {
    render(<FiltrosDashboard onAplicar={() => {}} />);

    expect(screen.queryByLabelText('Área')).not.toBeInTheDocument();
  });

  it('[DASH-15 CA-4] con `areas` muestra un selector con "Todas las áreas" y cada área', () => {
    render(<FiltrosDashboard onAplicar={() => {}} areas={AREAS} />);

    const selector = screen.getByLabelText('Área');
    expect(selector).toHaveValue('');
    expect(Array.from(selector.options).map((o) => o.textContent)).toEqual([
      'Todas las áreas',
      'Tecnología',
      'Infraestructura',
    ]);
  });

  it('[DASH-15 CA-4] Aplicar entrega `idArea` numérico, o cadena vacía con "Todas las áreas"', async () => {
    const alAplicar = vi.fn();
    render(<FiltrosDashboard onAplicar={alAplicar} areas={AREAS} />);

    await userEvent.selectOptions(screen.getByLabelText('Área'), 'Infraestructura');
    await aplicar();
    expect(alAplicar).toHaveBeenLastCalledWith({ desde: '', hasta: '', idArea: 2 });

    await userEvent.selectOptions(screen.getByLabelText('Área'), 'Todas las áreas');
    await aplicar();
    expect(alAplicar).toHaveBeenLastCalledWith({ desde: '', hasta: '', idArea: '' });
  });

  it('[DASH-15 CA-4] si las áreas no cargaron avisa con un alert y el formulario sigue operativo', () => {
    render(
      <FiltrosDashboard
        onAplicar={() => {}}
        areas={[]}
        errorAreas="No se pudieron cargar las áreas."
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar las áreas.');
    expect(screen.getByLabelText('Área')).toHaveAccessibleDescription(
      expect.stringContaining('No se pudieron cargar las áreas.'),
    );
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeEnabled();
  });
});
