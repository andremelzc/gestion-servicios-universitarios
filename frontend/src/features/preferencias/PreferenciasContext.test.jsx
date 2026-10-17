// @vitest-environment-options {"url": "https://localhost:3000"}
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { PreferenciasProvider, aplicarTema, usePreferencias } from './PreferenciasContext.jsx';
import {
  NOMBRE_COOKIE,
  borrarPreferencias,
  escribirPreferencias,
  leerPreferencias,
} from '../../services/cookiePreferencias.js';
import { restaurarAncho, simularAncho } from '../../test/simularAncho.js';

function Sonda() {
  const { tema, temaEfectivo, menuColapsado, setTema, setMenuColapsado, alternarMenu } =
    usePreferencias();
  return (
    <div>
      <p data-testid="tema">{String(tema)}</p>
      <p data-testid="efectivo">{temaEfectivo}</p>
      <p data-testid="menu">{String(menuColapsado)}</p>
      <button onClick={() => setTema('oscuro')}>oscuro</button>
      <button onClick={() => setTema('claro')}>claro</button>
      <button onClick={() => setTema(null)}>sistema</button>
      <button onClick={() => setMenuColapsado(true)}>colapsar</button>
      <button onClick={alternarMenu}>alternar</button>
    </div>
  );
}

// `sistemaOscuro` = valor de `prefers-color-scheme: dark`; toda prueba mockea `matchMedia`.
const montar = (sistemaOscuro = false) => {
  const ancho = simularAncho(sistemaOscuro);
  return {
    ancho,
    ...render(
      <PreferenciasProvider>
        <Sonda />
      </PreferenciasProvider>,
    ),
  };
};

afterEach(() => {
  borrarPreferencias();
  document.documentElement.removeAttribute('data-theme');
  restaurarAncho();
});

describe('PreferenciasProvider', () => {
  it('sin cookie: tema del sistema, menú expandido y sin data-theme', () => {
    montar(false);
    expect(screen.getByTestId('tema')).toHaveTextContent('null');
    expect(screen.getByTestId('efectivo')).toHaveTextContent('claro');
    expect(screen.getByTestId('menu')).toHaveTextContent('false');
    expect(document.documentElement).not.toHaveAttribute('data-theme');
    expect(document.cookie).not.toContain(NOMBRE_COOKIE);
  });

  it('sin preferencia explícita respeta prefers-color-scheme: dark', () => {
    montar(true);
    expect(screen.getByTestId('efectivo')).toHaveTextContent('oscuro');
  });

  it('sin matchMedia el tema efectivo es claro (no oscuro por defecto)', () => {
    restaurarAncho();
    render(
      <PreferenciasProvider>
        <Sonda />
      </PreferenciasProvider>,
    );
    expect(screen.getByTestId('efectivo')).toHaveTextContent('claro');
  });

  it('reacciona al cambio del tema del sistema y se desuscribe al desmontar', () => {
    const { ancho, unmount } = montar(false);
    expect(screen.getByTestId('efectivo')).toHaveTextContent('claro');
    act(() => ancho.cambiar(true));
    expect(screen.getByTestId('efectivo')).toHaveTextContent('oscuro');
    act(() => ancho.cambiar(false));
    expect(screen.getByTestId('efectivo')).toHaveTextContent('claro');
    unmount();
    expect(ancho.lista.removeEventListener).toHaveBeenCalled();
    expect(ancho.oyentes.size).toBe(0);
  });

  it('una preferencia explícita no cambia cuando cambia el sistema', () => {
    escribirPreferencias({ tema: 'claro', menuColapsado: false });
    const { ancho } = montar(false);
    act(() => ancho.cambiar(true));
    expect(screen.getByTestId('efectivo')).toHaveTextContent('claro');
  });

  it('restaura las preferencias desde la cookie al montar', () => {
    escribirPreferencias({ tema: 'oscuro', menuColapsado: true });
    montar();
    expect(screen.getByTestId('tema')).toHaveTextContent('oscuro');
    expect(screen.getByTestId('menu')).toHaveTextContent('true');
    expect(document.documentElement).toHaveAttribute('data-theme', 'oscuro');
  });

  it('setTema aplica data-theme y persiste en la cookie', async () => {
    montar();
    await userEvent.click(screen.getByRole('button', { name: 'oscuro' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'oscuro');
    expect(leerPreferencias().tema).toBe('oscuro');
    await userEvent.click(screen.getByRole('button', { name: 'claro' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'claro');
    expect(leerPreferencias().tema).toBe('claro');
  });

  it('setTema(null) vuelve a seguir al sistema y quita data-theme', async () => {
    escribirPreferencias({ tema: 'oscuro', menuColapsado: false });
    montar();
    await userEvent.click(screen.getByRole('button', { name: 'sistema' }));
    expect(document.documentElement).not.toHaveAttribute('data-theme');
    expect(leerPreferencias().tema).toBeNull();
  });

  it('setMenuColapsado y alternarMenu persisten sin tocar el tema', async () => {
    escribirPreferencias({ tema: 'oscuro', menuColapsado: false });
    montar();
    await userEvent.click(screen.getByRole('button', { name: 'colapsar' }));
    expect(leerPreferencias()).toEqual({ tema: 'oscuro', menuColapsado: true });
    await userEvent.click(screen.getByRole('button', { name: 'alternar' }));
    expect(screen.getByTestId('menu')).toHaveTextContent('false');
    expect(leerPreferencias()).toEqual({ tema: 'oscuro', menuColapsado: false });
  });

  it('al escribir fusiona con la cookie vigente (otra pestaña cambió el menú)', async () => {
    escribirPreferencias({ tema: null, menuColapsado: false });
    montar();
    escribirPreferencias({ tema: null, menuColapsado: true }); // otra pestaña
    await userEvent.click(screen.getByRole('button', { name: 'oscuro' }));
    expect(leerPreferencias()).toEqual({ tema: 'oscuro', menuColapsado: true });
  });

  it('ignora un valor de tema inválido', async () => {
    function Mala() {
      const { setTema } = usePreferencias();
      return <button onClick={() => setTema('rosa')}>mala</button>;
    }
    simularAncho(false);
    render(
      <PreferenciasProvider>
        <Mala />
        <Sonda />
      </PreferenciasProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'mala' }));
    expect(screen.getByTestId('tema')).toHaveTextContent('null');
    expect(document.cookie).not.toContain(NOMBRE_COOKIE);
  });

  it('con una cookie corrupta arranca con los valores por defecto', () => {
    document.cookie = `${NOMBRE_COOKIE}=%%%no-json; Path=/; Secure`;
    montar(false);
    expect(screen.getByTestId('tema')).toHaveTextContent('null');
    expect(screen.getByTestId('menu')).toHaveTextContent('false');
  });
});

describe('usePreferencias', () => {
  it('lanza un error claro fuera del proveedor', () => {
    const silenciar = (e) => e.preventDefault();
    window.addEventListener('error', silenciar);
    expect(() => render(<Sonda />)).toThrow(/dentro de <PreferenciasProvider>/);
    window.removeEventListener('error', silenciar);
  });
});

describe('aplicarTema', () => {
  it('fija y quita data-theme en <html>', () => {
    aplicarTema('oscuro');
    expect(document.documentElement).toHaveAttribute('data-theme', 'oscuro');
    aplicarTema(null);
    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });
});
