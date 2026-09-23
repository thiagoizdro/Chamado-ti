import type { Perfil } from '../generated/prisma/enums.js';

export type UsuarioAutenticado = {
  id: number;
  perfil: Perfil;
  escolaId: number | null;
};

declare global {
  namespace Express {
    interface Request {
      // Preenchido pelo middleware autenticar.
      usuario?: UsuarioAutenticado;
    }
  }
}
