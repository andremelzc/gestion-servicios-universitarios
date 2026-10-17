import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { restaurarAncho, simularAncho } from '../../test/simularAncho.js';
import DataTable from './DataTable.jsx';

const columns = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'activo', header: 'Estado', tipo: 'activo' },
];

const data = [
  { id: 1, nombre: 'Redes y Wi-Fi', activo: true },
  { id: 2, nombre: 'Pizarras', activo: false },
];

const pagina = { page: 0, size: 20, totalElements: 134, totalPages: 7 };

function tabla(props = {}) {
  return <DataTable caption="Categorías" columns={columns} data={data} {...props} />;
}

function renderTabla(props = {}) {
  return render(tabla(props));
}

afterEach(() => {
  restaurarAncho();
});

describe('DataTable · búsqueda y filtros', () => {
  it('[UX CA-14] emite cada cambio de la búsqueda sin aplicar debounce', async () => {
    const onSearchChange = vi.fn();
    renderTabla({ search: '', onSearchChange });

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'red');

    expect(onSearchChange).toHaveBeenCalledTimes(3);
    expect(onSearchChange).toHaveBeenLastCalledWith('d');
  });

  it('[UX CA-14] muestra el valor de búsqueda recibido y mantiene la barra mientras carga', () => {
    renderTabla({ search: 'wifi', onSearchChange: vi.fn(), isLoading: true });

    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveValue('wifi');
  });

  it('[UX CA-14] emite el filtro "Mostrar inactivas" con su valor', async () => {
    const onIncludeInactiveChange = vi.fn();
    renderTabla({ includeInactive: false, onIncludeInactiveChange });

    const casilla = screen.getByRole('checkbox', { name: 'Mostrar inactivas' });
    expect(casilla).not.toBeChecked();
    await userEvent.click(casilla);

    expect(onIncludeInactiveChange).toHaveBeenCalledWith(true);
  });

  it('[UX CA-14] refleja el filtro "Mostrar inactivas" ya activo', () => {
    renderTabla({ includeInactive: true, onIncludeInactiveChange: vi.fn() });

    expect(screen.getByRole('checkbox', { name: 'Mostrar inactivas' })).toBeChecked();
  });

  it('[UX CA-14] oculta búsqueda, filtro y paginación cuando la pantalla no los usa', () => {
    renderTabla();

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('[UX CA-14] permite añadir filtros propios de la pantalla', () => {
    renderTabla({
      filters: (
        <label>
          Área
          <select />
        </label>
      ),
    });

    expect(screen.getByRole('combobox', { name: 'Área' })).toBeInTheDocument();
  });

  it('[UX CA-14] el vacío con búsqueda usa un texto neutro, sin el valor que se está escribiendo', () => {
    renderTabla({ data: [], search: '<b>zzz', onSearchChange: vi.fn() });

    expect(screen.getByRole('status')).toHaveTextContent(
      /^Sin resultados\. Prueba con otra búsqueda\.$/,
    );
  });

  it('[UX CA-14] el vacío cita la búsqueda solo si se informa la ya aplicada', () => {
    renderTabla({
      data: [],
      search: 'zzzx',
      appliedSearch: 'zzz',
      onSearchChange: vi.fn(),
    });

    expect(screen.getByRole('status')).toHaveTextContent(
      'Sin resultados para «zzz». Prueba con otra búsqueda.',
    );
  });

  it('[UX CA-14] sin búsqueda activa el vacío usa el mensaje normal y su llamada a la acción', () => {
    renderTabla({
      data: [],
      search: '',
      onSearchChange: vi.fn(),
      emptyAction: <button type="button">Nueva categoría</button>,
    });

    expect(screen.getByRole('status')).toHaveTextContent('No hay registros para mostrar.');
    expect(screen.getByRole('button', { name: 'Nueva categoría' })).toBeInTheDocument();
  });
});

describe('DataTable · paginación', () => {
  it('[UX CA-14] anuncia la página actual y el total de registros', () => {
    renderTabla({ page: { ...pagina, page: 2 }, onPageChange: vi.fn() });

    const nav = screen.getByRole('navigation', { name: 'Paginación' });
    const estado = within(nav).getByRole('status');
    expect(estado).toHaveTextContent('Página 3 de 7');
    expect(estado).toHaveAttribute('aria-live', 'polite');
    expect(within(nav).getByText('134 registros')).toBeInTheDocument();
  });

  it('[UX CA-14] usa el singular con un solo registro', () => {
    renderTabla({
      page: { page: 0, size: 1, totalElements: 1, totalPages: 2 },
      onPageChange: vi.fn(),
    });

    expect(screen.getByText('1 registro')).toBeInTheDocument();
  });

  it('[UX CA-14] pide la página siguiente y la anterior (índice base 0 de la API)', async () => {
    const onPageChange = vi.fn();
    renderTabla({ page: { ...pagina, page: 2 }, onPageChange });

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 1);
  });

  it('[UX CA-14] deshabilita Anterior en la primera página y Siguiente en la última', () => {
    const { rerender } = renderTabla({ page: pagina, onPageChange: vi.fn() });
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();

    rerender(tabla({ page: { ...pagina, page: 6 }, onPageChange: vi.fn() }));
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });

  it('[UX CA-14] no muestra paginación con una sola página', () => {
    renderTabla({
      page: { ...pagina, totalElements: 2, totalPages: 1 },
      onPageChange: vi.fn(),
    });

    expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument();
  });

  it('[UX CA-14] la paginación sigue siendo operable en móvil', () => {
    simularAncho(false);
    renderTabla({ page: pagina, onPageChange: vi.fn() });

    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeInTheDocument();
  });

  describe('mientras carga', () => {
    it('[UX CA-14] mantiene la navegación montada con los botones deshabilitados', () => {
      renderTabla({
        page: { ...pagina, page: 2 },
        onPageChange: vi.fn(),
        isLoading: true,
      });

      expect(screen.getByRole('status', { name: 'Cargando…' })).toBeInTheDocument();
      const nav = screen.getByRole('navigation', { name: 'Paginación' });
      ['Anterior', 'Siguiente'].forEach((nombre) => {
        const boton = within(nav).getByRole('button', { name: nombre });
        expect(boton).toBeDisabled();
        expect(boton).toHaveAttribute('aria-disabled', 'true');
      });
    });

    it('[UX CA-14] no emite cambios de página mientras carga', async () => {
      const onPageChange = vi.fn();
      renderTabla({ page: { ...pagina, page: 2 }, onPageChange, isLoading: true });

      await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('[UX CA-14] el foco se queda en "Siguiente" al terminar de cargar', () => {
      const props = { page: { ...pagina, page: 2 }, onPageChange: vi.fn() };
      const { rerender } = renderTabla(props);
      const siguiente = screen.getByRole('button', { name: 'Siguiente' });
      siguiente.focus();

      rerender(tabla({ ...props, isLoading: true }));
      rerender(tabla({ ...props, page: { ...pagina, page: 3 } }));

      expect(screen.getByRole('button', { name: 'Siguiente' })).toBe(siguiente);
      expect(siguiente).toHaveFocus();
    });

    it('[UX CA-14] una única región aria-live actualiza el texto de la página', () => {
      const props = { page: { ...pagina, page: 2 }, onPageChange: vi.fn() };
      const { rerender } = renderTabla(props);
      const region = screen.getByRole('status', { name: '' });
      expect(region).toHaveTextContent('Página 3 de 7');

      rerender(tabla({ ...props, isLoading: true }));
      rerender(tabla({ ...props, page: { ...pagina, page: 3 } }));

      expect(within(screen.getByRole('navigation')).getByRole('status')).toBe(region);
      expect(region).toHaveTextContent('Página 4 de 7');
    });
  });
});
