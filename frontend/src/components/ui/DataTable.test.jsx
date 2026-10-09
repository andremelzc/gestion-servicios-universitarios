import { readFileSync } from 'node:fs';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { restaurarAncho, simularAncho } from '../../test/simularAncho.js';
import DataTable from './DataTable.jsx';

// Las pruebas corren desde la raíz de frontend/.
const css = readFileSync('src/components/ui/DataTable.css', 'utf8');

const columns = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'area', header: 'Área' },
  { key: 'activo', header: 'Estado', tipo: 'activo' },
];

const data = [
  { id: 1, nombre: 'Redes y Wi-Fi', area: 'TI', activo: true },
  { id: 2, nombre: 'Pizarras', area: 'Mantenimiento', activo: false },
];

function renderTabla(props = {}) {
  return render(<DataTable caption="Categorías" columns={columns} data={data} {...props} />);
}

afterEach(() => {
  restaurarAncho();
  vi.restoreAllMocks();
});

describe('DataTable', () => {
  describe('tabla (escritorio)', () => {
    it('[UX CA-14] muestra una tabla con caption, th scope y una fila por registro', () => {
      simularAncho(true);
      renderTabla();

      const tabla = screen.getByRole('table', { name: 'Categorías' });
      const cabeceras = within(tabla).getAllByRole('columnheader');
      expect(cabeceras.map((th) => th.textContent)).toEqual(['Nombre', 'Área', 'Estado']);
      cabeceras.forEach((th) => expect(th).toHaveAttribute('scope', 'col'));
      expect(within(tabla).getAllByRole('row')).toHaveLength(3);
      expect(within(tabla).getByText('Redes y Wi-Fi')).toBeInTheDocument();
    });

    it('[UX CA-14] usa la tabla por defecto si el navegador no soporta matchMedia', () => {
      renderTabla();

      expect(screen.getByRole('table', { name: 'Categorías' })).toBeInTheDocument();
    });

    it('[UX CA-14] envuelve la tabla en una región desplazable con foco de teclado', () => {
      simularAncho(true);
      renderTabla();

      const region = screen.getByRole('region', { name: 'Categorías' });
      expect(region).toHaveAttribute('tabindex', '0');
      expect(within(region).getByRole('table')).toBeInTheDocument();
    });

    it('[UX CA-14] muestra Activa/Inactiva con texto e icono oculto a lectores de pantalla', () => {
      simularAncho(true);
      renderTabla();

      const filaActiva = screen.getByRole('row', { name: /Redes y Wi-Fi/ });
      const filaInactiva = screen.getByRole('row', { name: /Pizarras/ });
      const activa = within(filaActiva).getByText('Activa');
      const inactiva = within(filaInactiva).getByText('Inactiva');
      [activa, inactiva].forEach((texto) => {
        const icono = texto.parentElement.querySelector('svg');
        expect(icono).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('[UX CA-14] permite cambiar las etiquetas de Activa/Inactiva', () => {
      simularAncho(true);
      renderTabla({ etiquetasActivo: { activo: 'Activo', inactivo: 'Inactivo' } });

      expect(screen.getByText('Activo')).toBeInTheDocument();
      expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });

    it('[UX CA-14] permite una celda personalizada con render', () => {
      simularAncho(true);
      const conRender = [
        { key: 'nombre', header: 'Nombre', render: (fila) => <b>{fila.nombre}!</b> },
      ];
      renderTabla({ columns: conRender });

      expect(screen.getByText('Redes y Wi-Fi!')).toBeInTheDocument();
    });

    it('[UX CA-14] expone el slot de acciones por fila con su cabecera', async () => {
      simularAncho(true);
      const onEditar = vi.fn();
      renderTabla({
        renderActions: (fila) => (
          <button type="button" onClick={() => onEditar(fila.id)}>
            Editar {fila.nombre}
          </button>
        ),
      });

      expect(screen.getByRole('columnheader', { name: 'Acciones' })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Editar Pizarras' }));
      expect(onEditar).toHaveBeenCalledWith(2);
    });

    it('[UX CA-14] permite cambiar la cabecera de acciones', () => {
      simularAncho(true);
      renderTabla({
        renderActions: () => <button type="button">Ver</button>,
        actionsHeader: 'Opciones',
      });

      expect(screen.getByRole('columnheader', { name: 'Opciones' })).toBeInTheDocument();
    });

    it('[UX CA-14] identifica las filas con rowKey', () => {
      simularAncho(true);
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const filas = [
        { codigo: 'A', nombre: 'Uno' },
        { codigo: 'B', nombre: 'Dos' },
      ];
      renderTabla({
        data: filas,
        columns: [{ key: 'nombre', header: 'Nombre' }],
        rowKey: 'codigo',
      });

      expect(screen.getAllByRole('row')).toHaveLength(3);
      expect(error).not.toHaveBeenCalled();
    });
  });

  describe('controles de los slots (44 px)', () => {
    it('[UX CA-14] dimensiona a 44 px los botones, enlaces y selects de los slots', () => {
      // jsdom no calcula estilos: se comprueba que la hoja cubra los controles que llegan por slot.
      const regla = (selector) =>
        new RegExp(`${selector.replace(/[\\.[\]]/g, '\\$&')}[^{]*\\{[^}]*min-height:\\s*44px`);
      expect(css).toMatch(regla('.data-table select'));
      expect(css).toMatch(regla('.data-table__acciones button'));
      expect(css).toMatch(regla('.data-table__acciones a'));
    });

    it('[UX CA-14] renderiza los controles de los slots dentro de .data-table__acciones', () => {
      simularAncho(true);
      renderTabla({
        renderActions: () => (
          <>
            <button type="button">Editar</button>
            <a href="/detalle">Ver</a>
          </>
        ),
      });

      const acciones = screen.getAllByRole('button', { name: 'Editar' })[0].parentElement;
      expect(acciones).toHaveClass('data-table__acciones');
      expect(within(acciones).getByRole('link', { name: 'Ver' })).toBeInTheDocument();
    });
  });

  describe('tarjetas (móvil)', () => {
    it('[UX CA-14] muestra una tarjeta por registro, sin tabla, con etiqueta por dato', () => {
      simularAncho(false);
      renderTabla();

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      const lista = screen.getByRole('list', { name: 'Categorías' });
      expect(lista).toHaveAttribute('role', 'list');
      const tarjetas = within(lista).getAllByRole('listitem');
      expect(tarjetas).toHaveLength(2);
      expect(within(tarjetas[1]).getByText('Área')).toBeInTheDocument();
      expect(within(tarjetas[1]).getByText('Mantenimiento')).toBeInTheDocument();
      expect(within(tarjetas[1]).getByText('Inactiva')).toBeInTheDocument();
    });

    it('[UX CA-14] incluye las acciones en cada tarjeta', () => {
      simularAncho(false);
      renderTabla({ renderActions: (fila) => <button type="button">Editar {fila.nombre}</button> });

      expect(screen.getByRole('button', { name: 'Editar Redes y Wi-Fi' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Editar Pizarras' })).toBeInTheDocument();
    });
  });

  describe('cambio de ancho', () => {
    it('[UX CA-14] pasa de tarjetas a tabla al cruzar 768 px (la vista se vuelve a montar)', () => {
      const ancho = simularAncho(false);
      renderTabla();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();

      act(() => ancho.cambiar(true));

      expect(screen.getByRole('table', { name: 'Categorías' })).toBeInTheDocument();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('[UX CA-14] deja de escuchar el cambio de ancho al desmontar', () => {
      const ancho = simularAncho(true);
      const { unmount } = renderTabla();
      expect(ancho.oyentes.size).toBe(1);

      unmount();

      expect(ancho.oyentes.size).toBe(0);
      expect(ancho.lista.removeEventListener).toHaveBeenCalled();
    });

    it('[UX CA-14] usa addListener/removeListener en navegadores sin addEventListener', () => {
      const ancho = simularAncho(false, { conAddEventListener: false });
      const { unmount } = renderTabla();

      act(() => ancho.cambiar(true));
      expect(screen.getByRole('table')).toBeInTheDocument();

      unmount();
      expect(ancho.lista.removeListener).toHaveBeenCalled();
      expect(ancho.oyentes.size).toBe(0);
    });

    it('[UX CA-14] no se vuelve a suscribir en cada render', () => {
      const ancho = simularAncho(true);
      const { rerender } = renderTabla();
      rerender(<DataTable caption="Categorías" columns={columns} data={[...data]} />);
      rerender(<DataTable caption="Categorías" columns={columns} data={[...data]} />);

      expect(ancho.lista.addEventListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('estados', () => {
    it('[UX CA-14] muestra un esqueleto anunciado mientras carga', () => {
      renderTabla({ isLoading: true });

      expect(screen.getByRole('status', { name: 'Cargando…' })).toHaveAttribute(
        'aria-busy',
        'true',
      );
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('[UX CA-14] el esqueleto tiene prioridad sobre los datos y el error', () => {
      renderTabla({ isLoading: true, error: { status: 500 } });

      expect(screen.getByRole('status', { name: 'Cargando…' })).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('[UX CA-14] muestra el estado vacío anunciado cuando no hay registros', () => {
      renderTabla({ data: [] });

      expect(screen.getByRole('status')).toHaveTextContent('No hay registros para mostrar.');
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('[UX CA-14] permite cambiar el mensaje vacío y añade una llamada a la acción', async () => {
      const onNuevo = vi.fn();
      renderTabla({
        data: [],
        emptyMessage: 'Aún no hay categorías.',
        emptyAction: (
          <button type="button" onClick={onNuevo}>
            Nueva categoría
          </button>
        ),
      });

      expect(screen.getByRole('status')).toHaveTextContent('Aún no hay categorías.');
      await userEvent.click(screen.getByRole('button', { name: 'Nueva categoría' }));
      expect(onNuevo).toHaveBeenCalledTimes(1);
    });

    it('[UX CA-14] el error tiene prioridad sobre los datos', () => {
      simularAncho(true);
      renderTabla({ error: { status: 403 } });

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('contrato de error (RFC 7807 normalizado)', () => {
    it.each([
      [403, 'No tienes permiso para realizar esta acción.'],
      [404, 'No encontramos esa solicitud. Es posible que no exista o no tengas acceso.'],
      [429, 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'],
      [0, 'Sin conexión. Revisa tu internet; reintentaremos automáticamente.'],
    ])('[UX CA-14] estado %s muestra el microcopy de UX §9', (status, texto) => {
      renderTabla({ error: { status, detail: 'texto del servidor que no debe verse' } });

      expect(screen.getByRole('alert')).toHaveTextContent(texto);
      expect(screen.getByRole('alert')).not.toHaveTextContent('servidor');
    });

    it('[UX CA-14] la marca sinConexion muestra el aviso sin conexión', () => {
      renderTabla({ error: { sinConexion: true } });

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Sin conexión. Revisa tu internet; reintentaremos automáticamente.',
      );
    });

    it('[UX CA-14] 500 muestra el mensaje inesperado con el código de soporte', () => {
      renderTabla({ error: { status: 500, traceId: 'abc-123' } });

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Ocurrió un error inesperado. Si persiste, informa este código de soporte: abc-123.',
      );
    });

    it('[UX CA-14] 500 sin traceId omite el código de soporte', () => {
      renderTabla({ error: { status: 503 } });

      expect(screen.getByRole('alert')).toHaveTextContent(/^Ocurrió un error inesperado\.$/);
    });

    it('[UX CA-14] sin microcopy para el estado usa detail', () => {
      renderTabla({ error: { status: 409, detail: 'Ya existe una categoría con ese nombre.' } });

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Ya existe una categoría con ese nombre.',
      );
    });

    it('[UX CA-14] 401 (lo gestiona apiClient) usa el mensaje genérico, no detail', () => {
      renderTabla({ error: { status: 401, detail: 'No autenticado', traceId: 't-1' } });

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Ocurrió un error inesperado. Si persiste, informa este código de soporte: t-1.',
      );
      expect(screen.getByRole('alert')).not.toHaveTextContent('No autenticado');
    });

    it('[UX CA-14] no lee error.message', () => {
      renderTabla({ error: { message: 'mensaje interno' } });

      expect(screen.getByRole('alert')).not.toHaveTextContent('mensaje interno');
    });

    it('[UX CA-14] permite reintentar desde el error', async () => {
      const onRetry = vi.fn();
      renderTabla({ error: { status: 500 }, onRetry });

      await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('accesibilidad de la API', () => {
    it('[UX CA-14] avisa en desarrollo si caption está vacío', () => {
      const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
      renderTabla({ caption: '' });

      expect(aviso).toHaveBeenCalledWith(expect.stringContaining('caption'));
    });

    it('[UX CA-14] no avisa cuando caption está informado', () => {
      const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
      renderTabla();

      expect(aviso).not.toHaveBeenCalled();
    });
  });
});
