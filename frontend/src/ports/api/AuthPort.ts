import type { AuthSession } from '../../domain/models/Auth';

export interface AuthPort {
  login(correo: string, password: string): Promise<AuthSession>;
}
