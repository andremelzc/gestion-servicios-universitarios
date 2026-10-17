import {
  Bar,
  BarChart,
  LabelList,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { COLOR_NEUTRO, formatValor } from '../chartUtils.js';

const ALTO = 280;
const TICK = { fill: COLOR_NEUTRO, fontSize: 12 };

// Cada barra toma su color del item (tokens/colorHex), no el de la librería.
function BarraColor(props) {
  return <Rectangle {...props} fill={props.payload.color} />;
}

/**
 * Gráfico de barras con etiqueta de valor sobre cada barra (el color nunca es el
 * único indicador). `items`: [{ nombre, valor, color }]. Se usa dentro de `ChartCard`.
 */
export default function BarrasChart({ items, horizontal = false, etiquetaValor }) {
  const margen = { top: 20, right: horizontal ? 32 : 8, bottom: 8, left: 8 };

  return (
    <ResponsiveContainer
      width="100%"
      height={horizontal ? Math.max(ALTO, items.length * 44) : ALTO}
      initialDimension={{ width: 480, height: ALTO }}
    >
      <BarChart
        data={items}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={margen}
        accessibilityLayer={false}
      >
        {horizontal ? (
          <>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis type="category" dataKey="nombre" width={120} tick={TICK} interval={0} />
          </>
        ) : (
          <>
            <XAxis dataKey="nombre" tick={TICK} interval={0} />
            <YAxis allowDecimals={false} tick={TICK} width={32} />
          </>
        )}
        <Tooltip
          cursor={{ fill: 'rgba(17, 24, 39, 0.06)' }}
          formatter={(valor) => [formatValor(valor), etiquetaValor]}
        />
        <Bar dataKey="valor" name={etiquetaValor} shape={BarraColor} isAnimationActive={false}>
          <LabelList
            dataKey="valor"
            position={horizontal ? 'right' : 'top'}
            formatter={formatValor}
            fill="#111827"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
