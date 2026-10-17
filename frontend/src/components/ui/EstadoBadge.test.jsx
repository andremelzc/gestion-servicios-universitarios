import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import EstadoBadge from './EstadoBadge.jsx';

const css = readFileSync('src/components/ui/EstadoBadge.css', 'utf8');

const estados = [
  { codigo: 'REGISTRADA', nombreVisible: 'Registrada', colorHex: '#6B7280' },
  { codigo: 'EN_EVALUACION', nombreVisible: 'En evaluación', colorHex: '#D97706' },
  { codigo: 'ASIGNADA', nombreVisible: 'Asignada', colorHex: '#2563EB' },
  { codigo: 'EN_ATENCION', nombreVisible: 'En atención', colorHex: '#7C3AED' },
  { codigo: 'RESUELTA', nombreVisible: 'Resuelta', colorHex: '#059669' },
  { codigo: 'CERRADA', nombreVisible: 'Cerrada', colorHex: '#047857' },
];

describe('EstadoBadge', () => {
  it.each(estados)('[US-21 CA-1] muestra el texto "$nombreVisible" del estado', (estado) => {
    render(<EstadoBadge estado={estado} />);
    expect(screen.getByText(estado.nombreVisible, { exact: false })).toBeInTheDocument();
  });

  it('[US-21 CA-1] incluye un punto de color oculto a lectores de pantalla', () => {
    const { container } = render(<EstadoBadge estado={estados[1]} />);
    const punto = container.querySelector('.estado-badge__punto');
    expect(punto).toHaveAttribute('aria-hidden', 'true');
    expect(punto).toBeEmptyDOMElement();
  });

  it('[US-21 CA-1] el punto no aporta texto: el único texto es prefijo + nombre', () => {
    const { container } = render(<EstadoBadge estado={estados[3]} />);
    expect(screen.getByText('Estado:')).toHaveClass('sr-only');
    expect(screen.getByText('En atención', { exact: false })).toBeInTheDocument();
    expect(container.querySelector('.estado-badge__punto')).toBeEmptyDOMElement();
  });

  it('[US-21 CA-1] acepta el estado como cadena (api-rest §2.2)', () => {
    const { container } = render(<EstadoBadge estado="ASIGNADA" />);
    expect(screen.getByText('Asignada', { exact: false })).toBeInTheDocument();
    expect(container.firstChild.style.getPropertyValue('--estado-color')).toBe(
      'var(--color-estado-asignada)',
    );
  });

  it('[US-21 CA-1] acepta los campos planos del DTO (estadoCodigo/Nombre/ColorHex)', () => {
    const s = {
      estadoCodigo: 'EN_EVALUACION',
      estadoNombre: 'En evaluación',
      estadoColorHex: '#D97706',
    };
    const { container } = render(
      <EstadoBadge estado={s.estadoCodigo} nombre={s.estadoNombre} colorHex={s.estadoColorHex} />,
    );
    expect(screen.getByText('En evaluación', { exact: false })).toBeInTheDocument();
    expect(container.firstChild.style.getPropertyValue('--estado-color')).toBe('#D97706');
  });

  it('[US-21 CA-1] los props planos prevalecen sobre los del objeto', () => {
    const { container } = render(
      <EstadoBadge estado={estados[0]} nombre="Recibida" colorHex="#112233" />,
    );
    expect(screen.getByText('Recibida', { exact: false })).toBeInTheDocument();
    expect(container.firstChild.style.getPropertyValue('--estado-color')).toBe('#112233');
  });

  it('[US-21 CA-3] mostrarPrefijo={false} omite el prefijo para lectores de pantalla', () => {
    render(<EstadoBadge estado={estados[0]} mostrarPrefijo={false} />);
    expect(screen.queryByText('Estado:')).not.toBeInTheDocument();
    expect(screen.getByText('Registrada')).toBeInTheDocument();
  });

  it('[US-21 CA-1] toma el colorHex del catálogo como variable CSS', () => {
    const { container } = render(<EstadoBadge estado={estados[1]} />);
    expect(container.firstChild.style.getPropertyValue('--estado-color')).toBe('#D97706');
  });

  it('[US-21 CA-1] usa el token del código si el colorHex falta o es inválido', () => {
    const { container, rerender } = render(
      <EstadoBadge estado={{ codigo: 'ASIGNADA', nombreVisible: 'Asignada' }} />,
    );
    expect(container.firstChild.style.getPropertyValue('--estado-color')).toBe(
      'var(--color-estado-asignada)',
    );
    rerender(
      <EstadoBadge
        estado={{ codigo: 'ASIGNADA', nombreVisible: 'Asignada', colorHex: 'url(javascript:x)' }}
      />,
    );
    expect(container.firstChild.style.getPropertyValue('--estado-color')).toBe(
      'var(--color-estado-asignada)',
    );
  });

  it('[US-21 CA-1] sin nombreVisible humaniza el código; código desconocido usa color neutro', () => {
    const { container } = render(<EstadoBadge estado={{ codigo: 'EN_REVISION' }} />);
    expect(screen.getByText('En revision')).toBeInTheDocument();
    expect(container.firstChild.style.getPropertyValue('--estado-color')).toBe(
      'var(--color-text-muted)',
    );
  });

  it('[US-21 CA-1] sin estado no renderiza nada', () => {
    const { container } = render(<EstadoBadge estado={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('[US-21 CA-2] el fondo tiene respaldo antes de color-mix y el punto lleva anillo oscuro', () => {
    expect(css.indexOf('var(--color-bg')).toBeGreaterThan(-1);
    expect(css.indexOf('var(--color-bg')).toBeLessThan(css.indexOf('color-mix'));
    expect(css).toMatch(/\.estado-badge__punto\s*\{[^}]*box-shadow:[^;]*var\(--color-text/);
  });
});
