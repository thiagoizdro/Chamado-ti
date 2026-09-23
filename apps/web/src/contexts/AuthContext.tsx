import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useCallback, useEffect, useMemo } from 'react';

import { definirAoPerderSessao } from '../lib/api';
import * as authService from '../services/auth.service';
import type { DadosLogin } from '../services/auth.service';
import { AuthContext, type ValorAuth } from './authContexto';

const CHAVE_SESSAO = ['auth', 'me'] as const;

// A sessão é só mais uma query: "quem está logado?" vem de GET /auth/me.
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: usuario = null, isPending } = useQuery({
    queryKey: CHAVE_SESSAO,
    queryFn: authService.buscarUsuarioLogado,
    staleTime: 5 * 60 * 1000,
  });

  // Marca a sessão como encerrada e descarta dados em cache de outras telas
  // (não podem vazar para o próximo usuário que logar).
  const encerrarSessao = useCallback(() => {
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
    queryClient.setQueryData(CHAVE_SESSAO, null);
  }, [queryClient]);

  // Qualquer 401 da API (token expirado, usuário desativado) encerra a sessão;
  // a RotaProtegida então manda para /login.
  useEffect(() => definirAoPerderSessao(encerrarSessao), [encerrarSessao]);

  const entrar = useCallback(
    async (dados: DadosLogin) => {
      const usuarioLogado = await authService.login(dados);
      queryClient.setQueryData(CHAVE_SESSAO, usuarioLogado);
      return usuarioLogado;
    },
    [queryClient],
  );

  const sair = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      encerrarSessao();
    }
  }, [encerrarSessao]);

  const valor = useMemo<ValorAuth>(
    () => ({ usuario, carregando: isPending, entrar, sair }),
    [usuario, isPending, entrar, sair],
  );

  return <AuthContext value={valor}>{children}</AuthContext>;
}
