import { useSearchParams } from 'react-router';

import type { FiltroAtivo } from '../types/paginacao';

const FILTROS_ATIVO: FiltroAtivo[] = ['ativos', 'inativos', 'todos'];

type Alteracoes = Record<string, string | undefined>;

// Página, busca e filtros ficam na URL: sobrevivem ao F5, ao botão voltar e
// podem ser compartilhados por link.
export function useParametrosLista() {
  const [parametros, setParametros] = useSearchParams();

  const pagina = Math.max(1, Number(parametros.get('pagina')) || 1);
  const busca = parametros.get('q') ?? '';
  const ativoNaUrl = parametros.get('ativo') as FiltroAtivo | null;
  const ativo = ativoNaUrl && FILTROS_ATIVO.includes(ativoNaUrl) ? ativoNaUrl : 'ativos';

  // Valor vazio/undefined remove o parâmetro da URL (URL limpa).
  function alterar(alteracoes: Alteracoes, substituirHistorico = false) {
    setParametros(
      (atuais) => {
        const novos = new URLSearchParams(atuais);
        for (const [nome, valor] of Object.entries(alteracoes)) {
          if (valor) novos.set(nome, valor);
          else novos.delete(nome);
        }
        return novos;
      },
      { replace: substituirHistorico },
    );
  }

  return {
    pagina,
    busca,
    ativo,
    filtro: (nome: string) => parametros.get(nome) ?? '',
    mudarPagina: (novaPagina: number) =>
      alterar({ pagina: novaPagina > 1 ? String(novaPagina) : undefined }),
    // Busca digitada não empilha histórico a cada tecla.
    mudarBusca: (texto: string) => alterar({ q: texto.trim(), pagina: undefined }, true),
    mudarAtivo: (valor: FiltroAtivo) =>
      alterar({ ativo: valor === 'ativos' ? undefined : valor, pagina: undefined }),
    mudarFiltro: (nome: string, valor: string) => alterar({ [nome]: valor, pagina: undefined }),
    // Volta para a lista sem busca, filtros nem página (entra no histórico).
    limparFiltros: () => setParametros(new URLSearchParams()),
  };
}
