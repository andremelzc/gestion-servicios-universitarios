import { COLOR_PRIMARIO, ordenarPorValorDesc } from '../chartUtils.js';
import BarrasChart from './BarrasChart.jsx';
import ChartCard from './ChartCard.jsx';

export default function ResponsableBarChart({ datos, nivelTitulo }) {
  const items = ordenarPorValorDesc(datos).map((d) => ({
    ...d,
    color: COLOR_PRIMARIO,
  }));

  return (
    <ChartCard
      titulo="Solicitudes por responsable"
      tipo="Gráfico de barras horizontales"
      items={items}
      nivelTitulo={nivelTitulo}
      etiquetaValor="Asignadas"
    >
      <BarrasChart items={items} horizontal etiquetaValor="Asignadas" />
    </ChartCard>
  );
}
