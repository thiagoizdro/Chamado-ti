import { createContext } from 'react';

import type { DadosLogin } from '../services/auth.service';
import type { UsuarioLogado } from '../types/usuario';

export type ValorAuth = {
  usuario: UsuarioLogado | null;
  carregando: boolean;
  entrar: (dados: DadosLogin) => Promise<UsuarioLogado>;
  sair: () => Promise<void>;
};

// Fica separado do AuthProvider porque o Fast Refresh do Vite exige que
// arquivos .tsx exportem apenas componentes.
export const AuthContext = createContext<ValorAuth | null>(null);
