import { servicoCrud } from '../lib/crud';
import type { DadosUsuario, Usuario } from '../types/cadastros';

export const usuariosService = servicoCrud<Usuario, DadosUsuario>('/usuarios');

// Sem senha: na edição, senha ausente mantém a atual.
export function dadosDoUsuario({ nome, email, perfil, escolaId }: Usuario): DadosUsuario {
  return { nome, email, perfil, escolaId };
}
