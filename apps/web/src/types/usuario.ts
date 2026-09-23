export type Perfil = 'SOLICITANTE' | 'TECNICO' | 'ADMIN';

// Formato devolvido por /api/auth/login e /api/auth/me.
export type UsuarioLogado = {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  escolaId: number | null;
  escola: { id: number; nome: string } | null;
};
