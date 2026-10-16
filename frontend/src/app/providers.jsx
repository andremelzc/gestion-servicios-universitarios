import { StrictMode } from 'react';
import { AuthProvider } from '../features/auth/AuthContext.jsx';

// Punto único para los proveedores globales (AuthProvider, Toasts…) que llegan en issues posteriores.
export default function Providers({ children }) {
  return (
    <StrictMode>
      <AuthProvider>{children}</AuthProvider>
    </StrictMode>
  );
}
