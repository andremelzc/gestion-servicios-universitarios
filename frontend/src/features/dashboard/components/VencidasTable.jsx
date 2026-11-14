import { Link } from 'react-router-dom';
import DataTable from '../../../components/ui/DataTable.jsx';
import EstadoBadge from '../../../components/ui/EstadoBadge.jsx';
import PrioridadTag from '../../../components/ui/PrioridadTag.jsx';

const fechaLimite = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima' });

function formatearFecha(valor) {
  if (!valor) return 'Sin fecha';
  const conZona = /(Z|[+-]\d{2}:?\d{2})$/.test(valor) ? valor : `${valor}Z`;
  const instante = new Date(conZona);
  return Number.isNaN(instante.getTime()) ? 'Sin fecha' : fechaLimite.format(instante);
}

const columns = [
  {
    key: 'codigo',
    header: 'Código',
    render: (fila) => <Link to={`/solicitudes/${fila.id}`}>{fila.codigo}</Link>,
  },
  { key: 'titulo', header: 'Título' },
  {
    key: 'prioridadNivel',
    header: 'Prioridad',
    render: (fila) => <PrioridadTag prioridad={fila.prioridadNivel} mostrarPrefijo={false} />,
  },
  {
    key: 'estadoNombre',
    header: 'Estado',
    render: (fila) => (
      <EstadoBadge
        estado={fila.estadoCodigo ?? fila.estadoNombre}
        nombre={fila.estadoNombre}
        colorHex={fila.estadoColorHex}
        mostrarPrefijo={false}
      />
    ),
  },
  {
    key: 'fechaLimiteSla',
    header: 'Fecha límite',
    render: (fila) => formatearFecha(fila.fechaLimiteSla),
  },
];

export default function VencidasTable({ datos, onPageChange, isLoading = false }) {
  return (
    <DataTable
      caption="Solicitudes vencidas"
      columns={columns}
      data={datos.content ?? []}
      isLoading={isLoading}
      page={{ ...datos, page: datos.page ?? datos.number ?? 0 }}
      onPageChange={onPageChange}
      emptyMessage="No hay solicitudes vencidas."
    />
  );
}
