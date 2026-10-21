import { useId } from 'react';
import { esNumero } from '../format.js';
import KpiCard from './KpiCard.jsx';
import KpiGrid from './KpiGrid.jsx';
import './KpiResumen.css';

/**
 * Indicadores de `GET /dashboard/kpis` (API §3.4). `mttrHoras` es `null` sin solicitudes resueltas.
 * La región lleva un h2 "Indicadores clave", el mismo que muestra `WidgetEstado` al cargar o fallar.
 */
export default function KpiResumen({ datos }) {
  const tituloId = useId();
  const kpis = datos ?? {};

  return (
    <section className="kpi-resumen" aria-labelledby={tituloId}>
      <h2 id={tituloId} className="kpi-resumen__titulo">
        Indicadores clave
      </h2>
      <KpiGrid etiqueta="Cifras del período">
        <KpiCard titulo="Registradas" valor={kpis.registradas} />
        <KpiCard titulo="Pendientes" valor={kpis.pendientes} />
        <KpiCard titulo="Atendidas" valor={kpis.atendidas} />
        <KpiCard titulo="% Resueltas" valor={kpis.porcentajeResueltas} unidad="%" />
        <KpiCard
          titulo="MTTR"
          valor={kpis.mttrHoras}
          unidad="h"
          descripcion={
            esNumero(kpis.mttrHoras) ? undefined : 'Aún no hay solicitudes resueltas en el período.'
          }
        />
        <KpiCard titulo="Vencidas" valor={kpis.vencidas} />
      </KpiGrid>
    </section>
  );
}
