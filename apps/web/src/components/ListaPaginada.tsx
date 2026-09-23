import type { UseQueryResult } from '@tanstack/react-query';

import { mensagemDoErro } from '../lib/api';
import type { RespostaPaginada } from '../types/paginacao';
import { EstadoCarregando, EstadoErro, EstadoVazio } from './ui/Estados';
import { Paginacao } from './ui/Paginacao';
import { type Coluna, Tabela } from './ui/Tabela';

type Props<T> = {
  consulta: UseQueryResult<RespostaPaginada<T>>;
  legenda: string;
  colunas: Coluna<T>[];
  chave: (item: T) => string | number;
  mensagemVazio: string;
  mensagemErro: string;
  aoMudarPagina: (pagina: number) => void;
};

// Resolve os estados de uma lista vinda da API: carregando, erro, vazia ou
// tabela com paginação.
export function ListaPaginada<T>({
  consulta,
  legenda,
  colunas,
  chave,
  mensagemVazio,
  mensagemErro,
  aoMudarPagina,
}: Props<T>) {
  if (consulta.isPending) return <EstadoCarregando />;

  if (consulta.isError) {
    return (
      <EstadoErro
        mensagem={mensagemDoErro(consulta.error, mensagemErro)}
        aoTentarNovamente={() => void consulta.refetch()}
      />
    );
  }

  const { dados, pagina, porPagina, total } = consulta.data;
  if (dados.length === 0) return <EstadoVazio mensagem={mensagemVazio} />;

  return (
    <>
      <Tabela legenda={legenda} colunas={colunas} itens={dados} chave={chave} />
      <Paginacao
        pagina={pagina}
        porPagina={porPagina}
        total={total}
        aoMudarPagina={aoMudarPagina}
      />
    </>
  );
}
