// Mis solicitudes propias (REG-18 · US-21 · CA-11; UX W-04): tabla en escritorio y tarjetas en
// móvil con `DataTable`, filtro por estado, búsqueda con *debounce*, paginación de 20 y estado
// vacío de UX §9. El listado lo lleva `useCrud` contra `GET /solicitudes/mis-solicitudes`
// (api-rest §3.2): el backend responde ordenado por fecha descendente y con el sobre de §2.3.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/ui/Button.jsx';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import DataTable from '../../../components/ui/DataTable.jsx';
import EstadoBadge from '../../../components/ui/EstadoBadge.jsx';
import PrioridadTag from '../../../components/ui/PrioridadTag.jsx';
import { etiquetaEstado } from '../../../components/ui/catalogos.js';
import useCrud from '../../admin/hooks/useCrud.js';
import Select from '../../../components/ui/Select.jsx';
import './MisSolicitudesPage.css';

const RUTA_MIS_SOLICITUDES = '/solicitudes/mis-solicitudes';

// Los 6 estados fijos de la solicitud (ADR-009), en orden del ciclo de vida (UX §2.1).
const ESTADOS = ['REGISTRADA', 'EN_EVALUACION', 'ASIGNADA', 'EN_ATENCION', 'RESUELTA', 'CERRADA'];

// api-rest §1: los instantes viajan en UTC y se muestran en America/Lima. Los `LocalDateTime`
// del backend (ClockConfig usa UTC) llegan sin sufijo de zona: se completa la `Z` al interpretarlos.
const FORMATO_FECHA = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/Lima',
});

function formatearFecha(iso) {
  if (!iso) return 'Sin fecha';
  const conZona = /(Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}Z`;
  return FORMATO_FECHA.format(new Date(conZona));
}

// `mostrarPrefijo: false`: la cabecera de columna (o el `dt` de la tarjeta) ya titula el dato.
const COLUMNAS = [
  {
    key: 'codigo',
    header: 'Código',
    render: (solicitud) => <Link to={`/solicitudes/${solicitud.id}`}>{solicitud.codigo}</Link>,
  },
  { key: 'titulo', header: 'Título' },
  {
    key: 'estadoCodigo',
    header: 'Estado',
    render: (solicitud) => (
      <EstadoBadge
        estado={solicitud.estadoCodigo}
        nombre={solicitud.estadoNombre}
        colorHex={solicitud.estadoColorHex}
        mostrarPrefijo={false}
      />
    ),
  },
  {
    key: 'prioridadNivel',
    header: 'Prioridad',
    render: (solicitud) => (
      <PrioridadTag prioridad={solicitud.prioridadNivel} mostrarPrefijo={false} />
    ),
  },
  {
    key: 'fechaRegistro',
    header: 'Fecha',
    render: (solicitud) => formatearFecha(solicitud.fechaRegistro),
  },
];

const MENSAJE_VACIO = 'Aún no tienes solicitudes. Crea la primera para empezar.';
const MENSAJE_SIN_COINCIDENCIAS = 'No hay solicitudes en este estado.';

export default function MisSolicitudesPage() {
  const [estado, setEstado] = useState('');
  const lista = useCrud(RUTA_MIS_SOLICITUDES, { filtros: { estado } });

  const filtroEstado = (
    <label className="data-table__campo">
      Estado
      <Select
        className="data-table__control"
        value={estado}
        onChange={(evento) => setEstado(evento.currentTarget.value)}
      >
        <option value="">Todas</option>
        {ESTADOS.map((codigo) => (
          <option key={codigo} value={codigo}>
            {etiquetaEstado(codigo)}
          </option>
        ))}
      </Select>
    </label>
  );

  return (
    <main className="mis-solicitudes">
      <PageHeader
        titulo="Mis solicitudes"
        descripcion="Consulta el estado de tus solicitudes de servicio."
        icono="clipboard"
        acciones={
          <Button como={Link} to="/solicitudes/nueva" icono="plus">
            Nueva solicitud
          </Button>
        }
      />

      <DataTable
        caption="Mis solicitudes"
        columns={COLUMNAS}
        data={lista.data}
        isLoading={lista.isLoading}
        error={lista.error}
        onRetry={lista.onRetry}
        search={lista.search}
        onSearchChange={lista.onSearchChange}
        appliedSearch={lista.appliedSearch}
        filters={filtroEstado}
        page={lista.page}
        onPageChange={lista.onPageChange}
        emptyMessage={estado ? MENSAJE_SIN_COINCIDENCIAS : MENSAJE_VACIO}
        emptyAction={
          estado ? null : (
            <Button como={Link} to="/solicitudes/nueva" icono="plus">
              Crear una
            </Button>
          )
        }
      />
    </main>
  );
}
