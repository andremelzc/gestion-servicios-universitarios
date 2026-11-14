import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { rolPuedeAcceder } from '../../app/rutasAcceso.js';
import { tituloDeRuta, useTituloBase } from '../../app/titulos.js';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { SECCIONES_ADMIN } from '../../features/admin/secciones.js';
import Icon from '../ui/Icon.jsx';
import useMediaQuery from '../ui/useMediaQuery.js';
import MarcaGisu from './MarcaGisu.jsx';
import './AppShell.css';

// Etiquetas legibles de rol (los valores del backend son los del contrato api-rest §3.1).
const ETIQUETA_ROL = {
  ESTUDIANTE: 'Estudiante',
  TECNICO: 'Técnico',
  SUPERVISOR: 'Supervisor',
  ADMIN: 'Administrador',
};

// Menú por rol (UX §3), agrupado para el menú lateral. Cada opción se filtra con `rolPuedeAcceder`,
// la misma fuente que los guards: lo que no se puede abrir no se ofrece.
const GRUPOS_MENU = [
  {
    titulo: 'Solicitudes',
    opciones: [
      { to: '/mis-solicitudes', etiqueta: 'Mis solicitudes', icono: 'clipboard' },
      { to: '/solicitudes/nueva', etiqueta: 'Nueva solicitud', icono: 'plus' },
    ],
  },
  {
    titulo: 'Gestión',
    opciones: [
      { to: '/bandeja', etiqueta: 'Bandeja', icono: 'inbox' },
      { to: '/dashboard', etiqueta: 'Dashboard', icono: 'chart' },
    ],
  },
  // Solo el administrador ve este grupo (`rolPuedeAcceder` filtra cada sección por su ruta).
  { titulo: 'Administración', opciones: SECCIONES_ADMIN },
  {
    titulo: 'Cuenta',
    opciones: [{ to: '/perfil', etiqueta: 'Perfil', icono: 'user' }],
  },
];

const CLAVE_COLAPSADO = 'gisu_menu_colapsado';
const CONSULTA_MOVIL = '(max-width: 1023px)';

function leerColapsado() {
  try {
    return localStorage.getItem(CLAVE_COLAPSADO) === '1';
  } catch {
    return false;
  }
}

function guardarColapsado(valor) {
  try {
    localStorage.setItem(CLAVE_COLAPSADO, valor ? '1' : '0');
  } catch {
    /* sin persistencia: la preferencia solo dura la sesión de la página */
  }
}

// Iniciales para el avatar (decorativo: el nombre completo va en el texto del botón).
const iniciales = ({ nombre = '', apellido = '' }) =>
  `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase() || '?';

// Shell de la "Aplicación (requiere sesión)" (UX §3; arquitectura técnica §4.2): menú lateral por
// rol (plegable en escritorio, cajón en móvil), barra superior con el menú de usuario y cierre de
// sesión (AUTH-19). Los guards (ProtectedRoute/RoleRoute) van por fuera: sin sesión o sin rol no
// se llega a pintarlo.
export default function AppShell({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const esMovil = useMediaQuery(CONSULTA_MOVIL);
  useTituloBase(tituloDeRuta(pathname));
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [colapsado, setColapsado] = useState(leerColapsado);
  // El cajón móvil guarda la ruta en la que se abrió: al navegar deja de coincidir y queda cerrado.
  const [cajonRuta, setCajonRuta] = useState(null);
  const cajonAbierto = cajonRuta === pathname;
  const contenedorRef = useRef(null);
  const botonRef = useRef(null);
  const lateralRef = useRef(null);
  const hamburguesaRef = useRef(null);
  const devolverFocoRef = useRef(false);

  // Cierra con clic fuera o Esc (devolviendo el foco al botón): patrón de menú desplegable.
  useEffect(() => {
    if (!menuAbierto) return undefined;

    const alSenalarFuera = (evento) => {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
        setMenuAbierto(false);
      }
    };
    const alPulsarTecla = (evento) => {
      if (evento.key === 'Escape') {
        setMenuAbierto(false);
        botonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', alSenalarFuera);
    document.addEventListener('keydown', alPulsarTecla);
    return () => {
      document.removeEventListener('mousedown', alSenalarFuera);
      document.removeEventListener('keydown', alPulsarTecla);
    };
  }, [menuAbierto]);

  // El cajón móvil se cierra con Esc (devolviendo el foco a su botón) y, al abrirse, lleva el foco a
  // su primera opción. Mientras está abierto el resto de la página queda `inert`.
  // El foco vuelve al botón del cajón recién cuando la página deja de ser `inert` (tras el render).
  useEffect(() => {
    if (!cajonAbierto && devolverFocoRef.current) {
      devolverFocoRef.current = false;
      hamburguesaRef.current?.focus();
    }
  }, [cajonAbierto]);

  useEffect(() => {
    if (!cajonAbierto) return undefined;
    lateralRef.current?.querySelector('a, button')?.focus();
    const alPulsarTecla = (evento) => {
      if (evento.key === 'Escape') {
        devolverFocoRef.current = true;
        setCajonRuta(null);
      }
    };
    document.addEventListener('keydown', alPulsarTecla);
    return () => document.removeEventListener('keydown', alPulsarTecla);
  }, [cajonAbierto]);

  // AUTH-19: `logout()` borra la clave persistida y el estado en memoria; navegamos al login.
  const cerrarSesion = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const alternarColapso = () => {
    setColapsado((previo) => {
      guardarColapsado(!previo);
      return !previo;
    });
  };

  const clases = [
    'app-shell',
    colapsado && 'app-shell--colapsado',
    cajonAbierto && 'app-shell--cajon',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={clases}>
      <a className="app-shell__salto" href="#contenido-principal">
        Saltar al contenido
      </a>

      {usuario && (
        <>
          <aside className="app-shell__lateral" id="menu-lateral" ref={lateralRef}>
            <div className="app-shell__lateral-cabecera">
              <div className="app-shell__marca">
                <MarcaGisu />
              </div>
              <button
                type="button"
                className="app-shell__cerrar-cajon"
                aria-label="Cerrar menú"
                onClick={() => {
                  devolverFocoRef.current = true;
                  setCajonRuta(null);
                }}
              >
                <Icon nombre="cerrar" tamano={20} />
              </button>
            </div>

            <nav className="app-shell__nav" aria-label="Principal">
              {GRUPOS_MENU.map(({ titulo, opciones }) => {
                const visibles = opciones.filter(({ to }) => rolPuedeAcceder(usuario.rol, to));
                if (visibles.length === 0) return null;
                return (
                  <div className="app-shell__grupo" key={titulo}>
                    <p className="app-shell__grupo-titulo">{titulo}</p>
                    <ul className="app-shell__nav-lista">
                      {visibles.map(({ to, etiqueta, icono }) => (
                        <li key={to}>
                          <NavLink
                            to={to}
                            className="app-shell__enlace"
                            title={colapsado ? etiqueta : undefined}
                          >
                            <Icon nombre={icono} tamano={20} />
                            <span className="app-shell__etiqueta">{etiqueta}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </nav>
          </aside>
          {cajonAbierto && (
            <div
              className="app-shell__velo"
              aria-hidden="true"
              onClick={() => {
                devolverFocoRef.current = true;
                setCajonRuta(null);
              }}
            />
          )}
        </>
      )}

      <div className="app-shell__principal" inert={cajonAbierto && esMovil}>
        <header className="app-shell__cabecera">
          {usuario ? (
            <>
              <button
                type="button"
                ref={hamburguesaRef}
                className="app-shell__icono-boton app-shell__hamburguesa"
                aria-label="Abrir menú"
                aria-expanded={cajonAbierto}
                aria-controls="menu-lateral"
                onClick={() => setCajonRuta(pathname)}
              >
                <Icon nombre="menu" tamano={22} />
              </button>
              <button
                type="button"
                className="app-shell__icono-boton app-shell__colapsar"
                aria-label={colapsado ? 'Expandir menú' : 'Contraer menú'}
                aria-expanded={!colapsado}
                aria-controls="menu-lateral"
                onClick={alternarColapso}
              >
                <Icon nombre="menu" tamano={22} />
              </button>
              <div className="app-shell__marca-movil" aria-hidden="true" />
              <div className="app-shell__usuario" ref={contenedorRef}>
                <button
                  type="button"
                  ref={botonRef}
                  className="app-shell__boton"
                  aria-expanded={menuAbierto}
                  onClick={() => setMenuAbierto((previo) => !previo)}
                >
                  <span className="app-shell__avatar" aria-hidden="true">
                    {iniciales(usuario)}
                  </span>
                  <span className="app-shell__datos">
                    <span className="app-shell__nombre">
                      {usuario.nombre} {usuario.apellido}
                    </span>
                    <span className="app-shell__rol">
                      {ETIQUETA_ROL[usuario.rol] ?? usuario.rol}
                    </span>
                  </span>
                  <Icon nombre="chevron" tamano={16} className="app-shell__flecha" />
                </button>
                {menuAbierto && (
                  <div className="app-shell__menu">
                    <button type="button" className="app-shell__menu-opcion" onClick={cerrarSesion}>
                      <Icon nombre="logout" tamano={18} />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <MarcaGisu compacta />
          )}
        </header>
        <div className="app-shell__contenido" id="contenido-principal" tabIndex={-1}>
          {children}
        </div>
      </div>
    </div>
  );
}
