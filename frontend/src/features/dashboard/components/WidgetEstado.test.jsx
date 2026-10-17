import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import WidgetEstado from './WidgetEstado.jsx';

describe('WidgetEstado', () => {
  it('[US-12 CA-11] en estado ok muestra solo el contenido', () => {
    render(
      <WidgetEstado titulo="Solicitudes por estado" estado="ok">
        <p>Contenido del widget</p>
      </WidgetEstado>,
    );

    expect(screen.getByText('Contenido del widget')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('[US-12 CA-11] cargando: título, aviso para lectores de pantalla y región ocupada', () => {
    render(
      <WidgetEstado titulo="Solicitudes por estado" estado="cargando">
        <p>Contenido del widget</p>
      </WidgetEstado>,
    );

    expect(screen.getByRole('heading', { name: 'Solicitudes por estado' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Cargando Solicitudes por estado…');
    expect(screen.getByRole('region', { name: 'Solicitudes por estado' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.queryByText('Contenido del widget')).not.toBeInTheDocument();
  });

  it('[US-12 CA-10] error: muestra el mensaje de UX §9 como alerta y un botón Reintentar con nombre propio', async () => {
    const alReintentar = vi.fn();
    render(
      <WidgetEstado
        titulo="Solicitudes por estado"
        estado="error"
        error={{ status: 0, sinConexion: true }}
        onReintentar={alReintentar}
      >
        <p>Contenido del widget</p>
      </WidgetEstado>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Sin conexión. Revisa tu internet; reintentaremos automáticamente.',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Reintentar: Solicitudes por estado' }),
    );
    expect(alReintentar).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Contenido del widget')).not.toBeInTheDocument();
  });

  it('[US-12 CA-10] error 500 con traceId muestra el código de soporte', () => {
    render(
      <WidgetEstado
        titulo="Indicadores clave"
        estado="error"
        error={{ status: 500, traceId: 'abc123' }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('abc123');
  });

  it('[US-12 CA-10] error 403 explica la falta de permiso', () => {
    render(<WidgetEstado titulo="Indicadores clave" estado="error" error={{ status: 403 }} />);

    expect(screen.getByRole('alert')).toHaveTextContent('No tienes permiso');
  });

  it('[US-12 CA-10] con 403 no ofrece Reintentar: repetir la petición no cambia el permiso', () => {
    render(<WidgetEstado titulo="Indicadores clave" estado="error" error={{ status: 403 }} />);

    expect(screen.queryByRole('button', { name: /Reintentar/ })).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('[US-12 CA-10] con otros errores (500, sin conexión) sí ofrece Reintentar', () => {
    const { rerender } = render(
      <WidgetEstado titulo="Indicadores clave" estado="error" error={{ status: 500 }} />,
    );
    expect(
      screen.getByRole('button', { name: 'Reintentar: Indicadores clave' }),
    ).toBeInTheDocument();

    rerender(
      <WidgetEstado
        titulo="Indicadores clave"
        estado="error"
        error={{ status: 0, sinConexion: true }}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Reintentar: Indicadores clave' }),
    ).toBeInTheDocument();
  });

  it('[US-12 CA-11] la variante compacta de carga y error se marca con su clase', () => {
    const { container, rerender } = render(<WidgetEstado titulo="T" estado="cargando" />);
    expect(container.firstChild).not.toHaveClass('widget-estado--compacto');

    rerender(<WidgetEstado titulo="T" estado="cargando" compacto />);
    expect(container.firstChild).toHaveClass('widget-estado--compacto');
  });

  it('[US-12 CA-10] sin error recibido usa el mensaje genérico', () => {
    render(<WidgetEstado titulo="Indicadores clave" estado="error" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Ocurrió un error inesperado.');
  });

  it('[US-12 CA-13] acepta nivelTitulo y cae a h2 con un nivel inválido', () => {
    const { rerender } = render(<WidgetEstado titulo="T" estado="cargando" nivelTitulo={3} />);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();

    rerender(<WidgetEstado titulo="T" estado="cargando" nivelTitulo={9} />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});
