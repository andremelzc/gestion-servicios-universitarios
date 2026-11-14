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
        <KpiCard titulo="Registradas" valor={kpis.registradas} icono="inbox" tono="primario" />
        <KpiCard titulo="Pendientes" valor={kpis.pendientes} icono="clock" tono="advertencia" />
        <KpiCard titulo="Atendidas" valor={kpis.atendidas} icono="check" tono="violeta" />
        <KpiCard
          titulo="% Resueltas"
          valor={kpis.porcentajeResueltas}
          unidad="%"
          icono="percent"
          tono="exito"
        />
        <KpiCard
          titulo="Tiempo medio de resolución"
          valor={kpis.mttrHoras}
          unidad="h"
          icono="clock"
          tono="neutro"
          descripcion={
            esNumero(kpis.mttrHoras) ? undefined : 'Aún no hay solicitudes resueltas en el período.'
          }
        />
        <KpiCard titulo="Vencidas" valor={kpis.vencidas} icono="alert" tono="peligro" destacada />
      </KpiGrid>
    </section>
  );
}
