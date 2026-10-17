import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import './AppShell.css';

// Etiquetas legibles de rol (los valores del backend son los del contrato api-rest §3.1).
const ETIQUETA_ROL = {
  ESTUDIANTE: 'Estudiante',
  TECNICO: 'Técnico',
  SUPERVISOR: 'Supervisor',
  ADMIN: 'Administrador',
};

// Shell de la "Aplicación (requiere sesión)" (UX §3; arquitectura técnica §4.2): cabecera con
// menú de usuario (nombre y rol) y cierre de sesión (AUTH-19). La navegación por rol, los
// guards (ProtectedRoute/RoleRoute, issue #32) y el AdminLayout (ADM-13) llegan con sus tareas.
export default function AppShell({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const contenedorRef = useRef(null);
  const botonRef = useRef(null);

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

  // AUTH-19: `logout()` borra la clave persistida y el estado en memoria; navegamos al login.
  const cerrarSesion = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="app-shell__cabecera">
        <span className="app-shell__marca">Gestión de Servicios Universitarios</span>
        {usuario && (
          <div className="app-shell__usuario" ref={contenedorRef}>
            <button
              type="button"
              ref={botonRef}
              className="app-shell__boton"
              aria-expanded={menuAbierto}
              aria-haspopup="true"
              onClick={() => setMenuAbierto((previo) => !previo)}
            >
              <span className="app-shell__nombre">
                {usuario.nombre} {usuario.apellido}
              </span>
              <span className="app-shell__rol">{ETIQUETA_ROL[usuario.rol] ?? usuario.rol}</span>
            </button>
            {menuAbierto && (
              <div className="app-shell__menu">
                <button type="button" className="app-shell__menu-opcion" onClick={cerrarSesion}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </header>
      <div className="app-shell__contenido">{children}</div>
    </div>
  );
}
