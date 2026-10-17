import './KpiGrid.css';

export default function KpiGrid({ children, etiqueta = 'Indicadores clave' }) {
  return (
    <section className="kpi-grid" aria-label={etiqueta}>
      {children}
    </section>
  );
}
