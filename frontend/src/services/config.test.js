import { afterEach, describe, expect, it, vi } from 'vitest';

const loadConfig = async () => {
  vi.resetModules();
  return import('./config.js');
};

describe('config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('[BASE-04 CA-3] API_URL toma el valor de VITE_API_URL', async () => {
    vi.stubEnv('VITE_API_URL', '/x');

    const { API_URL } = await loadConfig();

    expect(API_URL).toBe('/x');
  });

  it('[BASE-04 CA-3] API_URL usa /api/v1 cuando VITE_API_URL no está definida', async () => {
    vi.stubEnv('VITE_API_URL', undefined);

    const { API_URL } = await loadConfig();

    expect(API_URL).toBe('/api/v1');
  });
});
