import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { authAdapter } from './AuthAdapter';

vi.mock('axios');

describe('AuthAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe realizar la petición de login y transformar la respuesta a AuthSession', async () => {
    const mockResponse = {
      data: {
        token: 'fake-jwt-token-xyz',
        tipo: 'Bearer',
        correo: 'estudiante@universidad.edu',
        rol: 'ROLE_ESTUDIANTE',
        idArea: 10
      }
    };

    (axios.post as any).mockResolvedValueOnce(mockResponse);

    const session = await authAdapter.login('estudiante@universidad.edu', 'Password123');

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      { correo: 'estudiante@universidad.edu', password: 'Password123' }
    );

    expect(session).toEqual({
      token: 'fake-jwt-token-xyz',
      tipo: 'Bearer',
      usuario: {
        correo: 'estudiante@universidad.edu',
        rol: 'ROLE_ESTUDIANTE',
        idArea: 10
      }
    });
  });

  it('debe propagar el error si axios.post falla', async () => {
    (axios.post as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(authAdapter.login('error@universidad.edu', 'Password123'))
      .rejects.toThrow('Network error');
  });
});
