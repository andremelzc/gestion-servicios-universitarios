import { createRoot } from 'react-dom/client';
import App from './app/App.jsx';
import './styles/tokens.css'; // Tokens primero: base.css y los componentes los consumen.
import './styles/base.css';

createRoot(document.getElementById('root')).render(<App />);
