import { render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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

  it('marca vencida según el indicador del API y, si no llega, por la fecha límite', () => {
    expect(estadoSla({ fechaLimiteSla: enHoras(5), vencida: true, ahora: AHORA }).nivel).toBe(
      'vencida',
    );
    expect(estadoSla({ fechaLimiteSla: enHoras(-1), ahora: AHORA }).nivel).toBe('vencida');
  });

  it('prefiere el `vencida` del backend: un desfase de reloj no la marca vencida', () => {
    expect(estadoSla({ fechaLimiteSla: enHoras(-0.1), vencida: false, ahora: AHORA })).toEqual({
      nivel: 'porVencer',
      texto: 'Vence en menos de 1 h',
    });
  });

  it('nunca sobrestima el tiempo que queda (redondea hacia abajo)', () => {
    expect(estadoSla({ fechaLimiteSla: enHoras(5.9), ahora: AHORA }).texto).toBe('Vence en 5 h');
    expect(estadoSla({ fechaLimiteSla: enHoras(0.99), ahora: AHORA }).texto).toBe(
      'Vence en menos de 1 h',
    );
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

describe('estadoSla con la zona horaria del navegador', () => {
  // El backend usa `Clock.systemUTC()` y manda `LocalDateTime` sin desfase ("2026-10-04T15:00:00"):
  // `new Date` lo leería como hora local y en Lima (UTC-5) sobraban 5 h.
  const zonaOriginal = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = 'America/Lima';
  });
  afterAll(() => {
    if (zonaOriginal === undefined) delete process.env.TZ;
    else process.env.TZ = zonaOriginal;
  });

  it('la prueba corre realmente en una zona distinta de UTC', () => {
    expect(new Date('2026-10-04T10:00:00').getTime()).toBe(Date.parse('2026-10-04T15:00:00Z'));
  });

  it('interpreta como UTC la fecha límite sin desfase', () => {
    const { texto } = estadoSla({ fechaLimiteSla: '2026-10-04T15:00:00', ahora: AHORA });
    expect(texto).toBe('Vence en 5 h');
  });

  it('respeta el desfase cuando la fecha lo trae', () => {
    expect(estadoSla({ fechaLimiteSla: '2026-10-04T15:00:00Z', ahora: AHORA }).texto).toBe(
      'Vence en 5 h',
    );
    expect(estadoSla({ fechaLimiteSla: '2026-10-04T10:00:00-05:00', ahora: AHORA }).texto).toBe(
      'Vence en 5 h',
    );
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

  it('el icono de "por vencer" se rellena con el color del texto', () => {
    const { container } = render(<SlaIndicador fechaLimiteSla={enHoras(2)} ahora={AHORA} />);
    expect(container.querySelector('path')).toHaveAttribute('fill', 'currentColor');
  });

  it('antepone un prefijo solo para lectores de pantalla', () => {
    render(<SlaIndicador fechaLimiteSla={enHoras(18)} ahora={AHORA} />);
    expect(screen.getByText('SLA:')).toHaveClass('sr-only');
    expect(screen.getByText('Vence en 18 h')).toBeInTheDocument();
  });
});
