import { useState } from 'react';
import { dashboardApi } from '../../../services/dashboard.api.js';
import CategoriaPieChart from '../components/CategoriaPieChart.jsx';
import EstadoBarChart from '../components/EstadoBarChart.jsx';
import FiltrosDashboard from '../components/FiltrosDashboard.jsx';
import KpiResumen from '../components/KpiResumen.jsx';
import { describirRango } from '../format.js';
import PrioridadBarChart from '../components/PrioridadBarChart.jsx';
import ResponsableBarChart from '../components/ResponsableBarChart.jsx';
import WidgetDashboard from '../components/WidgetDashboard.jsx';
import './DashboardPage.css';

// Sin fechas el backend aplica los últimos 30 días (API §3.4).
const FILTROS_INICIALES = { desde: '', hasta: '' };

/**
 * Dashboard (US-12, W-08). Cada widget carga por su cuenta (no hay `Promise.all`): uno que falle
 * o tarde no bloquea al resto. El filtro Área (solo ADMIN, RN-16) y la visibilidad por rol
 * quedan para DASH-15; `dashboardApi` ya acepta `idArea`.
 */
export default function DashboardPage() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  return (
    <main className="dashboard-page">
      <h1>Dashboard</h1>
      <FiltrosDashboard onAplicar={setFiltros} />
      <p className="dashboard-page__rango" aria-live="polite">
        {`Mostrando: ${describirRango(filtros)}`}
      </p>

      <WidgetDashboard
        titulo="Indicadores clave"
        cargar={dashboardApi.kpis}
        filtros={filtros}
        compacto
      >
        {(datos) => <KpiResumen datos={datos} />}
      </WidgetDashboard>

      <div className="dashboard-page__graficos">
        <WidgetDashboard
          titulo="Solicitudes por categoría"
          cargar={dashboardApi.porCategoria}
          filtros={filtros}
        >
          {(datos) => <CategoriaPieChart datos={datos} nivelTitulo={2} />}
        </WidgetDashboard>
        <WidgetDashboard
          titulo="Solicitudes por prioridad"
          cargar={dashboardApi.porPrioridad}
          filtros={filtros}
        >
          {(datos) => <PrioridadBarChart datos={datos} nivelTitulo={2} />}
        </WidgetDashboard>
        <WidgetDashboard
          titulo="Solicitudes por responsable"
          cargar={dashboardApi.porResponsable}
          filtros={filtros}
        >
          {(datos) => <ResponsableBarChart datos={datos} nivelTitulo={2} />}
        </WidgetDashboard>
        <WidgetDashboard
          titulo="Solicitudes por estado"
          cargar={dashboardApi.porEstado}
          filtros={filtros}
        >
          {(datos) => <EstadoBarChart datos={datos} nivelTitulo={2} />}
        </WidgetDashboard>
      </div>
    </main>
  );
}
