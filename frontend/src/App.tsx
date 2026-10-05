import { useAuthStore } from '../store/useAuthStore';
import { LogIn, LogOut, CheckCircle } from 'lucide-react';
import { useState } from 'react';

function App() {
  const { session, isLoading, error, login, logout, isAuthenticated } = useAuthStore();
  
  const [correo, setCorreo] = useState('supervisor@universidad.edu');
  const [password, setPassword] = useState('password123');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(correo, password);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Sistema Inteligente</h1>
        <p style={{ color: 'var(--text-muted)' }}>Gestión Integral de Servicios Universitarios</p>
      </header>

      <main className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        
        {!isAuthenticated() ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Iniciar Sesión</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Conéctate al entorno de staging
              </p>
            </div>

            {error && (
              <div style={{ 
                padding: '0.75rem', 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Correo Institucional</label>
              <input 
                type="email" 
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--surface-border)',
                  color: 'white', outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--surface-border)',
                  color: 'white', outline: 'none'
                }}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              {isLoading ? 'Conectando...' : (
                <>
                  <LogIn size={18} /> Ingresar
                </>
              )}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center' }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '50%', 
              background: 'rgba(16, 185, 129, 0.1)', color: '#34d399',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CheckCircle size={24} />
            </div>
            
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>¡Bienvenido!</h2>
              <p style={{ color: 'var(--text-muted)' }}>Has iniciado sesión correctamente.</p>
            </div>

            <div style={{ width: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem', textAlign: 'left', fontSize: '0.875rem' }}>
              <p><strong style={{ color: '#818cf8' }}>Usuario:</strong> {session?.usuario.correo}</p>
              <p><strong style={{ color: '#818cf8' }}>Rol:</strong> {session?.usuario.rol}</p>
              <p><strong style={{ color: '#818cf8' }}>Token:</strong> {session?.token.substring(0, 20)}...</p>
            </div>

            <button onClick={logout} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'transparent', border: '1px solid var(--surface-border)', width: '100%', justifyContent: 'center' }}>
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
