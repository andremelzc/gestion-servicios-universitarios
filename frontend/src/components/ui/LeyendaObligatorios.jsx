// Criterio único de los formularios (AUD-09): lo opcional se rotula "(opcional)"; el resto es obligatorio.
import './LeyendaObligatorios.css';
export default function LeyendaObligatorios() {
  return (
    <p className="leyenda-obligatorios">
      Todos los campos son obligatorios, salvo los marcados como «(opcional)».
    </p>
  );
}
