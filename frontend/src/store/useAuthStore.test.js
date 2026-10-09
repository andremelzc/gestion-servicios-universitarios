import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';
import { authAdapter } from '../adapters/http/AuthAdapter';

vi.mock('../adapters/http/AuthAdapter', () => ({
  authAdapter: {
    login: vi.fn(),
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ session: null, isLoading: false, error: null });
  });

  it('debe iniciar con estado no autenticado', () => {
    const { session, isLoading, error, isAuthenticated } = useAuthStore.getState();
    expect(session).toBeNull();
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it('debe iniciar sesión exitosamente y actualizar el estado', async () => {
    const mockSession = {
      token: 'jwt-123',
      tipo: 'Bearer',
      usuario: {
        correo: 'estudiante@universidad.edu',
        rol: 'ROLE_ESTUDIANTE',
        idArea: null,
      },
    };

    authAdapter.login.mockResolvedValueOnce(mockSession);

    await useAuthStore.getState().login('estudiante@universidad.edu', 'Password123');

    const state = useAuthStore.getState();
    expect(state.session).toEqual(mockSession);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.isAuthenticated()).toBe(true);
  });

  it('debe manejar error al fallar el login', async () => {
    const errorResponse = {
      response: {
        data: {
          detail: 'Credenciales inválidas',
        },
      },
    };

    authAdapter.login.mockRejectedValueOnce(errorResponse);

    await expect(
      useAuthStore.getState().login('estudiante@universidad.edu', 'WrongPass'),
    ).rejects.toEqual(errorResponse);

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Credenciales inválidas');
    expect(state.isAuthenticated()).toBe(false);
  });

  it('debe cerrar sesión correctamente con logout()', () => {
    useAuthStore.setState({
      session: {
        token: 'token-abc',
        tipo: 'Bearer',
        usuario: { correo: 'test@universidad.edu', rol: 'ADMIN', idArea: 1 },
      },
    });

    expect(useAuthStore.getState().isAuthenticated()).toBe(true);

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });
});
