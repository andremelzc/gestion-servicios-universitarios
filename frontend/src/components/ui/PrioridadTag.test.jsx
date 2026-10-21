import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PrioridadTag from './PrioridadTag.jsx';

const niveles = [
  ['BAJA', 'Baja'],
  ['MEDIA', 'Media'],
  ['ALTA', 'Alta'],
  ['CRITICA', 'Crítica'],
];

describe('PrioridadTag', () => {
  it.each(niveles)('[US-21 CA-1] muestra el texto de %s como "%s"', (codigo, texto) => {
    render(<PrioridadTag prioridad={codigo} />);
    expect(screen.getByText(texto, { exact: false })).toBeInTheDocument();
  });

  it('[US-21 CA-1] cada nivel tiene un icono distinto, oculto a lectores de pantalla', () => {
    const iconos = niveles.map(([codigo]) => {
      const { container, unmount } = render(<PrioridadTag prioridad={codigo} />);
      const icono = container.querySelector('svg');
      expect(icono).toHaveAttribute('aria-hidden', 'true');
      const forma = icono.innerHTML;
      unmount();
      return forma;
    });
    expect(new Set(iconos).size).toBe(4);
  });

  it('[US-21 CA-1] el prefijo oculto precede al texto de la prioridad', () => {
    render(<PrioridadTag prioridad="CRITICA" />);
    expect(screen.getByText('Prioridad:')).toHaveClass('sr-only');
    expect(screen.getByText('Crítica', { exact: false })).toBeInTheDocument();
  });

  it('[US-21 CA-1] acepta el nombre con tilde o en minúsculas', () => {
    render(<PrioridadTag prioridad="crítica" />);
    expect(screen.getByText('Crítica', { exact: false })).toBeInTheDocument();
  });

  it('[US-21 CA-1] un código desconocido se humaniza con icono neutro', () => {
    const { container } = render(<PrioridadTag prioridad="URGENTE" />);
    expect(screen.getByText('Urgente', { exact: false })).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstChild).toHaveAttribute('data-nivel', 'desconocido');
  });

  it('[US-21 CA-1] sin prioridad no renderiza nada', () => {
    const { container } = render(<PrioridadTag prioridad={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('[US-21 CA-3] mostrarPrefijo={false} omite el prefijo para lectores de pantalla', () => {
    render(<PrioridadTag prioridad="ALTA" mostrarPrefijo={false} />);
    expect(screen.queryByText('Prioridad:')).not.toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
  });
});
