import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  abrirChamado,
  assumirChamado,
  buscarChamado,
  comentarChamado,
  listarChamados,
  mudarStatusChamado,
} from '../services/chamados.service';
import type { DadosAbrirChamado, DadosMudarStatus } from '../types/chamado';
import type { ParametrosLista } from '../types/paginacao';

export function useListaChamados(parametros: ParametrosLista) {
  return useQuery({
    queryKey: ['chamados', 'lista', parametros],
    queryFn: () => listarChamados(parametros),
    placeholderData: keepPreviousData,
  });
}

export function useChamado(id: number) {
  return useQuery({
    queryKey: ['chamados', 'item', id],
    queryFn: () => buscarChamado(id),
  });
}

// Toda ação num chamado mexe em listas, no detalhe e no histórico de
// defeitos do equipamento; invalidar tudo mantém as telas coerentes.
// Roda também no erro: um 409 significa que a tela estava desatualizada.
function useInvalidarChamados() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['chamados'] }),
      queryClient.invalidateQueries({ queryKey: ['equipamentos'] }),
    ]);
}

export function useAbrirChamado() {
  const invalidar = useInvalidarChamados();
  return useMutation({
    mutationFn: (dados: DadosAbrirChamado) => abrirChamado(dados),
    onSuccess: invalidar,
  });
}

export function useAssumirChamado() {
  const invalidar = useInvalidarChamados();
  return useMutation({
    mutationFn: (id: number) => assumirChamado(id),
    onSettled: invalidar,
  });
}

export function useMudarStatusChamado(id: number) {
  const invalidar = useInvalidarChamados();
  return useMutation({
    mutationFn: (dados: DadosMudarStatus) => mudarStatusChamado(id, dados),
    onSettled: invalidar,
  });
}

export function useComentarChamado(id: number) {
  const invalidar = useInvalidarChamados();
  return useMutation({
    mutationFn: (texto: string) => comentarChamado(id, texto),
    onSettled: invalidar,
  });
}
