import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { kpisEjemplo } from '../../../test/handlers/dashboard.js';
import KpiResumen from './KpiResumen.jsx';

// Cifra mostrada por la tarjeta `nombre`.
function cifra(nombre) {
  const grupo = screen.getByRole('group', { name: nombre });
  return grupo.querySelector('.kpi-card__valor');
}

describe('KpiResumen', () => {
  it('[US-12 CA-1] muestra los seis KPIs con las cifras del backend', () => {
    render(<KpiResumen datos={kpisEjemplo} />);

    expect(cifra('Registradas')).toHaveTextContent('150');
    expect(cifra('Pendientes')).toHaveTextContent('45');
    expect(cifra('Atendidas')).toHaveTextContent('98');
    expect(cifra('% Resueltas')).toHaveTextContent('70.5%');
    expect(cifra('MTTR')).toHaveTextContent('24.5h');
    expect(cifra('Vencidas')).toHaveTextContent('7');
  });

  it('[US-12 CA-13] es una región con un h2 "Indicadores clave" como nombre accesible', () => {
    render(<KpiResumen datos={kpisEjemplo} />);

    const region = screen.getByRole('region', { name: 'Indicadores clave' });
    expect(
      within(region).getByRole('heading', { level: 2, name: 'Indicadores clave' }),
    ).toBeInTheDocument();
    // La rejilla interna no repite el nombre de la región.
    expect(screen.getAllByRole('region', { name: 'Indicadores clave' })).toHaveLength(1);
    expect(within(region).getByRole('group', { name: 'Registradas' })).toBeInTheDocument();
  });

  it('[US-12 CA-11] con MTTR null muestra "—", lo explica y no afecta a los demás KPIs', () => {
    render(
      <KpiResumen
        datos={{ ...kpisEjemplo, atendidas: 0, porcentajeResueltas: 0, mttrHoras: null }}
      />,
    );

    const mttr = screen.getByRole('group', { name: 'MTTR' });
    expect(within(mttr).getByText('—')).toBeInTheDocument();
    expect(within(mttr).getByText('Sin datos')).toBeInTheDocument();
    expect(
      within(mttr).getByText('Aún no hay solicitudes resueltas en el período.'),
    ).toBeInTheDocument();
    expect(mttr).not.toHaveTextContent('NaN');
    expect(mttr).not.toHaveTextContent('null');
    expect(cifra('Registradas')).toHaveTextContent('150');
    expect(cifra('% Resueltas')).toHaveTextContent('0%');
  });

  it('[US-12 CA-11] con MTTR numérico no muestra la nota de "sin resueltas"', () => {
    render(<KpiResumen datos={kpisEjemplo} />);

    expect(screen.queryByText('Aún no hay solicitudes resueltas en el período.')).toBeNull();
  });

  it('[US-12 CA-11] sin datos (null) muestra "—" en todos los KPIs en lugar de romper', () => {
    render(<KpiResumen datos={null} />);

    expect(screen.getAllByText('—')).toHaveLength(6);
  });
});
