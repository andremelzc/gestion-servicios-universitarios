import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { dashboardApi } from '../../../services/dashboard.api.js';
import CategoriaPieChart from '../components/CategoriaPieChart.jsx';
import EstadoBarChart from '../components/EstadoBarChart.jsx';
import FiltrosDashboard from '../components/FiltrosDashboard.jsx';
import KpiResumen from '../components/KpiResumen.jsx';
import { describirRango } from '../format.js';
import PrioridadBarChart from '../components/PrioridadBarChart.jsx';
import ResponsableBarChart from '../components/ResponsableBarChart.jsx';
import WidgetDashboard from '../components/WidgetDashboard.jsx';
import { useAreas } from '../hooks/useAreas.js';
import './DashboardPage.css';

// Sin fechas el backend aplica los últimos 30 días (API §3.4).
const FILTROS_INICIALES = { desde: '', hasta: '' };

// Roles con acceso al dashboard (api-rest §3.4: T, S, D). El estudiante y el docente reciben 403.
const ROLES_CON_DASHBOARD = ['TECNICO', 'SUPERVISOR', 'ADMIN'];

/**
 * Dashboard (US-12, W-08). Cada widget carga por su cuenta (no hay `Promise.all`): uno que falle
 * o tarde no bloquea al resto.
 *
 * Visibilidad por rol (RN-16, DASH-15): esta guardia es solo comodidad de UI (el backend responde
 * 403 y acota el alcance). Un rol sin acceso ve un aviso y no se monta ningún widget, así que no
 * se hace ninguna petición. La ruta se restringe en el router (AUTH-18), no aquí.
 */
export default function DashboardPage() {
  const { isLoading, usuario } = useAuth();

  if (isLoading) return null;
  if (!ROLES_CON_DASHBOARD.includes(usuario?.rol)) return <AccesoNoPermitido />;
  return <DashboardContenido esAdmin={usuario.rol === 'ADMIN'} />;
}

// Mismo texto y foco que la página 403 del router (UX §9, "Sin permiso").
function AccesoNoPermitido() {
  const tituloRef = useRef(null);

  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  return (
    <main className="dashboard-page">
      <h1 ref={tituloRef} tabIndex={-1}>
        Acceso no permitido
      </h1>
      <p>Tu rol no tiene acceso al dashboard. Puedes seguir usando Mis solicitudes.</p>
    </main>
  );
}

// El filtro Área existe solo para ADMIN (RN-16): supervisor y técnico quedan acotados por el
// backend, así que para ellos no se pide `/areas` ni se envía `idArea`.
function DashboardContenido({ esAdmin }) {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const { areas, error: errorAreas } = useAreas(esAdmin);

  return (
    <main className="dashboard-page">
      <h1>Dashboard</h1>
      <FiltrosDashboard
        onAplicar={setFiltros}
        areas={esAdmin ? areas : undefined}
        errorAreas={esAdmin && errorAreas ? 'No se pudieron cargar las áreas.' : undefined}
      />
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
