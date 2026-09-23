import type { UseMutationResult } from '@tanstack/react-query';
import { useState } from 'react';

import { mensagemDoErro } from '../lib/api';

type Mensagem = { tipo: 'sucesso' | 'erro'; texto: string };

type Opcoes<TItem, TDados> = {
  salvar: UseMutationResult<unknown, Error, { id?: number; dados: TDados }>;
  desativar: UseMutationResult<void, Error, number>;
  // PUT substitui o cadastro: reativar reenvia os dados atuais com ativo: true.
  paraDados: (item: TItem) => TDados;
  textos: { desativado: string; reativado: string };
};

// Desativar (com confirmação) e reativar um item nas telas de lista.
export function useAlternarAtivo<TItem extends { id: number }, TDados>({
  salvar,
  desativar,
  paraDados,
  textos,
}: Opcoes<TItem, TDados>) {
  const [paraDesativar, setParaDesativar] = useState<TItem | null>(null);
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);

  async function confirmarDesativacao() {
    if (!paraDesativar) return;
    try {
      await desativar.mutateAsync(paraDesativar.id);
      setMensagem({ tipo: 'sucesso', texto: textos.desativado });
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: mensagemDoErro(erro) });
    } finally {
      setParaDesativar(null);
    }
  }

  async function reativar(item: TItem) {
    try {
      await salvar.mutateAsync({ id: item.id, dados: { ...paraDados(item), ativo: true } });
      setMensagem({ tipo: 'sucesso', texto: textos.reativado });
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: mensagemDoErro(erro) });
    }
  }

  return {
    paraDesativar,
    pedirDesativacao: setParaDesativar,
    cancelarDesativacao: () => setParaDesativar(null),
    confirmarDesativacao,
    reativar,
    processando: desativar.isPending || salvar.isPending,
    mensagem,
  };
}
