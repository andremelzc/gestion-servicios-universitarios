import { useId } from 'react';
import { IconoFicha } from '../../../components/ui/Icon.jsx';
import { SIN_DATO, esNumero, formatNumero } from '../format.js';
import './KpiCard.css';

export default function KpiCard({
  titulo,
  valor,
  unidad,
  icono,
  tono = 'primario',
  descripcion,
  destacada = false,
}) {
  const tituloId = useId();
  const sinDato = !esNumero(valor);

  return (
    <div
      className={destacada && !sinDato && valor > 0 ? 'kpi-card kpi-card--alerta' : 'kpi-card'}
      role="group"
      aria-labelledby={tituloId}
    >
      <div className="kpi-card__cabecera">
        {typeof icono === 'string' ? (
          <IconoFicha nombre={icono} tono={tono} />
        ) : icono ? (
          <span aria-hidden="true">{icono}</span>
        ) : null}
        <p id={tituloId} className="kpi-card__titulo">
          {titulo}
        </p>
      </div>
      <p className="kpi-card__valor">
        {sinDato ? (
          <>
            <span aria-hidden="true">{SIN_DATO}</span>
            <span className="sr-only">Sin datos</span>
          </>
        ) : (
          <>
            {formatNumero(valor)}
            {unidad ? <span className="kpi-card__unidad">{unidad}</span> : null}
          </>
        )}
      </p>
      {descripcion ? <p className="kpi-card__descripcion">{descripcion}</p> : null}
    </div>
  );
}
