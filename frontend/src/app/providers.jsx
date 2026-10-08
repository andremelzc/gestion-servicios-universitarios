import { StrictMode } from 'react';

// Punto único para los proveedores globales (AuthProvider, Toasts…) que llegan en issues posteriores.
export default function Providers({ children }) {
  return <StrictMode>{children}</StrictMode>;
}
