import { colorPrioridad, etiquetaPrioridad } from '../chartUtils.js';
import BarrasChart from './BarrasChart.jsx';
import ChartCard from './ChartCard.jsx';

export default function PrioridadBarChart({ datos, nivelTitulo }) {
  // Se conserva el orden recibido (por ponderador, CA-6), incluidos los valores 0.
  const items = (datos ?? []).map((d) => ({
    nombre: etiquetaPrioridad(d.nombre),
    valor: d.valor,
    color: colorPrioridad(d.nombre),
  }));

  return (
    <ChartCard
      titulo="Solicitudes por prioridad"
      tipo="Gráfico de barras"
      items={items}
      nivelTitulo={nivelTitulo}
    >
      <BarrasChart items={items} etiquetaValor="Solicitudes" />
    </ChartCard>
  );
}
