// @vitest-environment-options {"url": "https://localhost:3000"}
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import Providers from './providers.jsx';
import { usePreferencias } from '../features/preferencias/PreferenciasContext.jsx';
import { borrarPreferencias, leerPreferencias } from '../services/cookiePreferencias.js';
import { restaurarAncho, simularAncho } from '../test/simularAncho.js';

function Consumidor() {
  const { menuColapsado, alternarMenu } = usePreferencias();
  return <button onClick={alternarMenu}>menú colapsado: {String(menuColapsado)}</button>;
}

afterEach(() => {
  borrarPreferencias();
  document.documentElement.removeAttribute('data-theme');
  restaurarAncho();
});

describe('Providers', () => {
  it('expone las preferencias a la app y un cambio persiste en gu_prefs', async () => {
    simularAncho(false);
    render(
      <Providers>
        <Consumidor />
      </Providers>,
    );
    await userEvent.click(screen.getByText('menú colapsado: false'));
    expect(screen.getByText('menú colapsado: true')).toBeInTheDocument();
    expect(leerPreferencias().menuColapsado).toBe(true);
  });
});
