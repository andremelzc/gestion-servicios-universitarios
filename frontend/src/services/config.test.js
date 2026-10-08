import { describe, expect, it } from 'vitest';
import { API_URL } from './config.js';

describe('config', () => {
  it('[BASE-04 CA-3] API_URL toma VITE_API_URL o usa /api/v1 por defecto', () => {
    expect(API_URL).toBe(import.meta.env.VITE_API_URL ?? '/api/v1');
  });
});
