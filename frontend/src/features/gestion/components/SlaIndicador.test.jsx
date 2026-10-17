import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { estadoSla } from '../sla.js';
import SlaIndicador from './SlaIndicador.jsx';

const AHORA = Date.parse('2026-10-04T10:00:00Z');
const enHoras = (h) => new Date(AHORA + h * 3600_000).toISOString();

describe('estadoSla', () => {
  it('clasifica por tiempo restante', () => {
    expect(estadoSla({ fechaLimiteSla: enHoras(18), ahora: AHORA })).toMatchObject({
      nivel: 'aTiempo',
      texto: 'Vence en 18 h',
    });
    expect(estadoSla({ fechaLimiteSla: enHoras(2), ahora: AHORA })).toMatchObject({
      nivel: 'porVencer',
      texto: 'Vence en 2 h',
    });
    expect(estadoSla({ fechaLimiteSla: enHoras(0.2), ahora: AHORA }).texto).toBe(
      'Vence en menos de 1 h',
    );
    expect(estadoSla({ fechaLimiteSla: enHoras(72), ahora: AHORA }).texto).toBe('Vence en 3 d');
  });

  it('marca vencida por el indicador del API o por la fecha límite pasada', () => {
    expect(estadoSla({ fechaLimiteSla: enHoras(5), vencida: true, ahora: AHORA }).nivel).toBe(
      'vencida',
    );
    expect(estadoSla({ fechaLimiteSla: enHoras(-1), ahora: AHORA }).nivel).toBe('vencida');
  });

  it('no cuenta el SLA de una solicitud ya resuelta o cerrada', () => {
    const base = { fechaLimiteSla: enHoras(-1), vencida: false, ahora: AHORA };
    expect(estadoSla({ ...base, estadoCodigo: 'RESUELTA' }).nivel).toBe('atendida');
    expect(estadoSla({ ...base, estadoCodigo: 'CERRADA' }).nivel).toBe('atendida');
  });

  it('sin fecha límite informa que no hay SLA', () => {
    expect(estadoSla({ fechaLimiteSla: null, ahora: AHORA }).nivel).toBe('sinSla');
  });
});

describe('SlaIndicador', () => {
  it('muestra texto además del color y un icono decorativo', () => {
    const { container } = render(
      <SlaIndicador fechaLimiteSla={enHoras(-3)} vencida ahora={AHORA} />,
    );
    expect(screen.getByText('Vencida')).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstChild).toHaveAttribute('data-sla', 'vencida');
  });

  it('antepone un prefijo solo para lectores de pantalla', () => {
    render(<SlaIndicador fechaLimiteSla={enHoras(18)} ahora={AHORA} />);
    expect(screen.getByText('SLA:')).toHaveClass('sr-only');
    expect(screen.getByText('Vence en 18 h')).toBeInTheDocument();
  });
});
