import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App.jsx';

describe('App', () => {
  it('[BASE-04 CA-1] la SPA se renderiza y muestra la ruta inicial', async () => {
    render(<App />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Iniciar sesión' }),
    ).toBeInTheDocument();
  });
});
