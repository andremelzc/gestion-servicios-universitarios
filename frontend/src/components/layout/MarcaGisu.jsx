import './MarcaGisu.css';

export const NOMBRE_SISTEMA = 'Gestión Integral de Servicios Universitarios';

/**
 * Marca del sistema: sigla GISU y nombre completo. `compacta` es la versión de la cabecera
 * (una línea); la normal va centrada sobre las pantallas de acceso.
 */
export default function MarcaGisu({ compacta = false }) {
  return (
    <div className={compacta ? 'marca-gisu marca-gisu--compacta' : 'marca-gisu'}>
      <span className="marca-gisu__sigla">GISU</span>
      <span className="marca-gisu__nombre">{NOMBRE_SISTEMA}</span>
    </div>
  );
}
