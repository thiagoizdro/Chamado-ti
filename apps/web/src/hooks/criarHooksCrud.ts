import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ServicoCrud } from '../lib/crud';
import type { ParametrosLista } from '../types/paginacao';

// Gera os hooks de TanStack Query de um cadastro. Toda escrita invalida as
// queries do recurso, então listas e detalhes se atualizam sozinhos.
export function criarHooksCrud<TItem, TDados, TDetalhe = TItem>(
  chave: string,
  servico: ServicoCrud<TItem, TDados, TDetalhe>,
) {
  function useLista(parametros: ParametrosLista) {
    return useQuery({
      queryKey: [chave, 'lista', parametros],
      queryFn: () => servico.listar(parametros),
      // Mantém a página anterior na tela enquanto a próxima carrega.
      placeholderData: keepPreviousData,
    });
  }

  function useItem(id: number | undefined) {
    return useQuery({
      queryKey: [chave, 'item', id],
      queryFn: () => servico.buscar(id ?? 0),
      enabled: id !== undefined,
    });
  }

  function useSalvar() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, dados }: { id?: number; dados: TDados }) =>
        id ? servico.atualizar(id, dados) : servico.criar(dados),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [chave] }),
    });
  }

  function useDesativar() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: number) => servico.desativar(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [chave] }),
    });
  }

  return { useLista, useItem, useSalvar, useDesativar };
}
