import type { Escola } from '../types/cadastros';
import { useListaEscolas } from './useEscolas';

// A rede tem poucas escolas: uma página de 100 cobre o select com folga.
const LIMITE_ESCOLAS = 100;

// Escolas ativas para selects. Se o registro editado estiver ligado a uma
// escola que foi desativada depois, ela entra na lista para não sumir do select.
export function useOpcoesEscolas(escolaAtual?: { id: number; nome: string } | null) {
  const consulta = useListaEscolas({ porPagina: LIMITE_ESCOLAS, ativo: 'ativos' });
  const ativas: Pick<Escola, 'id' | 'nome'>[] = consulta.data?.dados ?? [];

  const incluirAtual = escolaAtual && !ativas.some((escola) => escola.id === escolaAtual.id);
  const opcoes = incluirAtual
    ? [...ativas, { id: escolaAtual.id, nome: `${escolaAtual.nome} (inativa)` }]
    : ativas;

  return { opcoes, carregando: consulta.isPending, erro: consulta.isError };
}
