import { StrictMode } from 'react';
import { AuthProvider } from '../features/auth/AuthContext.jsx';
import { PreferenciasProvider } from '../features/preferencias/PreferenciasContext.jsx';

// Punto único para los proveedores globales (AuthProvider, Toasts…) que llegan en issues posteriores.
export default function Providers({ children }) {
  return (
    <StrictMode>
      <PreferenciasProvider>
        <AuthProvider>{children}</AuthProvider>
      </PreferenciasProvider>
    </StrictMode>
  );
}
