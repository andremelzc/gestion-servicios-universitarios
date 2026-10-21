import './RegionAviso.css';

/**
 * Región `aria-live` de avisos de la bandeja ("SOL-… asignada a …"). Se renderiza SIEMPRE (vacía
 * al inicio): un lector de pantalla solo anuncia los cambios de una región que ya existía, así
 * que montarla junto con el mensaje no se anuncia. Vacía queda fuera de la vista (no
 * `display: none`, que la sacaría del árbol de accesibilidad). Sin `aria-label`: el contenido
 * del mensaje es lo que se lee.
 */
export default function RegionAviso({ mensaje }) {
  return (
    <p role="status" className="region-aviso">
      {mensaje}
    </p>
  );
}
