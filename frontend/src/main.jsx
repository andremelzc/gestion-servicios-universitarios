import { createRoot } from 'react-dom/client';
import App from './app/App.jsx';
import { aplicarTema } from './features/preferencias/PreferenciasContext.jsx';
import { leerPreferencias } from './services/cookiePreferencias.js';
import './styles/tokens.css'; // Tokens primero: base.css y los componentes los consumen.
import './styles/base.css';

// Tema de `gu_prefs` antes de montar React: sin parpadeo. Un script en línea en index.html
// lo haría antes aún, pero la CSP (`script-src 'self'`, ADR-004) lo prohíbe.
aplicarTema(leerPreferencias().tema);

createRoot(document.getElementById('root')).render(<App />);
