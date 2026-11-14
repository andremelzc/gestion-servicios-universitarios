import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo, `/api` se reenvía al backend (en producción lo hace Nginx).
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    // Con toda la suite en paralelo las pruebas con mucha escritura (formularios) rozaban los 5 s por
    // defecto y fallaban de forma intermitente; el margen no oculta fallos reales (cada prueba termina
    // en cuanto se cumple su condición).
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/*.test.{js,jsx}', 'src/test/**', 'src/main.jsx'],
      // Estrategia de pruebas §11: meta global >= 60 %; falla bajo 50 %.
      // Vitest solo admite un umbral: se usa el piso que bloquea el CI.
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
  },
});
