import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { coloresCategorias, formatValor } from '../chartUtils.js';
import ChartCard from './ChartCard.jsx';

export default function CategoriaPieChart({ datos, nivelTitulo }) {
  const lista = datos ?? [];
  const colores = coloresCategorias(lista.length);
  const items = lista.map((d, i) => ({ ...d, color: colores[i] }));

  return (
    <ChartCard
      titulo="Solicitudes por categoría"
      tipo="Gráfico de dona"
      items={items}
      mostrarPorcentaje
      nivelTitulo={nivelTitulo}
    >
      <ResponsiveContainer width="100%" height={280} initialDimension={{ width: 480, height: 280 }}>
        <PieChart accessibilityLayer={false}>
          <Pie
            data={items.map((item) => ({ ...item, fill: item.color }))}
            dataKey="valor"
            nameKey="nombre"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="#FFFFFF"
            isAnimationActive={false}
          />
          <Tooltip formatter={(valor) => [formatValor(valor), 'Solicitudes']} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
