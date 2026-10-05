export interface Usuario {
  correo: string;
  rol: string;
  idArea: number | null;
}

export interface AuthSession {
  token: string;
  tipo: string;
  usuario: Usuario;
}
