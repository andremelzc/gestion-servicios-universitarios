import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import KpiGrid from './KpiGrid.jsx';
import KpiCard from './KpiCard.jsx';

const css = readFileSync(
  resolve(process.cwd(), 'src/features/dashboard/components/KpiGrid.css'),
  'utf8',
);

describe('KpiGrid', () => {
  it('[US-12 CA-13] agrupa las tarjetas en una región con nombre accesible', () => {
    render(
      <KpiGrid>
        <KpiCard titulo="Registradas" valor={150} />
        <KpiCard titulo="Pendientes" valor={45} />
      </KpiGrid>,
    );

    const region = screen.getByRole('region', { name: 'Indicadores clave' });
    expect(region).toContainElement(screen.getByRole('group', { name: 'Registradas' }));
    expect(region).toContainElement(screen.getByRole('group', { name: 'Pendientes' }));
  });

  it('[US-12 CA-13] permite nombrar la región con otra etiqueta', () => {
    render(
      <KpiGrid etiqueta="Resumen del área">
        <KpiCard titulo="Registradas" valor={1} />
      </KpiGrid>,
    );

    expect(screen.getByRole('region', { name: 'Resumen del área' })).toBeInTheDocument();
  });

  it('[US-12 CA-13] la rejilla es mobile-first: 1 columna base, 2 en md (768px) y 5 en lg (1024px)', () => {
    const base = css.split('@media')[0];
    expect(base).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);

    expect(css).toMatch(
      /@media \(min-width:\s*768px\)\s*{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
    );
    expect(css).toMatch(
      /@media \(min-width:\s*1024px\)\s*{[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/,
    );
  });

  it('[US-12 CA-13] las columnas usan minmax(0, 1fr) para evitar scroll horizontal', () => {
    const declaraciones = [...css.matchAll(/grid-template-columns:\s*([^;]+);/g)];
    expect(declaraciones.length).toBeGreaterThanOrEqual(3);
    for (const [, valor] of declaraciones) {
      expect(valor).toContain('minmax(0, 1fr)');
    }
  });
});
