import { colorEstado, etiquetaEstado } from '../chartUtils.js';
import BarrasChart from './BarrasChart.jsx';
import ChartCard from './ChartCard.jsx';

export default function EstadoBarChart({ datos, nivelTitulo }) {
  // Orden recibido (por `orden` del catálogo, CA-6); color desde `colorHex`.
  const items = (datos ?? []).map((d) => ({
    nombre: etiquetaEstado(d.nombre),
    valor: d.valor,
    color: colorEstado(d.colorHex),
  }));

  return (
    <ChartCard
      titulo="Solicitudes por estado"
      tipo="Gráfico de barras horizontales"
      items={items}
      nivelTitulo={nivelTitulo}
    >
      <BarrasChart items={items} horizontal etiquetaValor="Solicitudes" />
    </ChartCard>
  );
}
