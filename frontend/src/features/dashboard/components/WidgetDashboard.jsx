import { useDashboardWidget } from '../hooks/useDashboardWidget.js';
import WidgetEstado from './WidgetEstado.jsx';

/**
 * Contenedor (Container/Presentational, arquitectura §4.2): carga un widget con su propio estado
 * y reintento, y delega el dibujo en `children(datos)`, que solo se invoca con datos listos.
 * `cargar` debe ser estable (función del módulo `dashboardApi`).
 */
export default function WidgetDashboard({
  titulo,
  cargar,
  filtros,
  nivelTitulo,
  compacto,
  children,
}) {
  const { estado, datos, error, reintentar } = useDashboardWidget(cargar, filtros);

  return (
    <WidgetEstado
      titulo={titulo}
      estado={estado}
      error={error}
      onReintentar={reintentar}
      nivelTitulo={nivelTitulo}
      compacto={compacto}
    >
      {estado === 'ok' ? children(datos) : null}
    </WidgetEstado>
  );
}
