import { Link } from 'react-router';

import type { EquipamentoRanking } from '../../types/dashboard';
import { EstadoVazio } from '../ui/Estados';
import { classeFoco } from '../ui/estilos';
import { type Coluna, Tabela } from '../ui/Tabela';

const colunas: Coluna<EquipamentoRanking & { posicao: number }>[] = [
  { titulo: '#', className: 'tabular-nums text-slate-600', celula: (item) => item.posicao },
  {
    titulo: 'Patrimônio',
    celula: (item) => (
      <Link
        to={`/equipamentos/${item.id}`}
        className={`font-medium text-blue-800 underline-offset-2 hover:underline ${classeFoco}`}
      >
        {item.patrimonio}
      </Link>
    ),
  },
  {
    titulo: 'Equipamento',
    celula: (item) => [item.tipo, item.modelo].filter(Boolean).join(' · '),
  },
  { titulo: 'Escola', celula: (item) => item.escola.nome },
  {
    titulo: 'Chamados',
    className: 'text-right tabular-nums',
    celula: (item) => item.total,
  },
];

export function RankingEquipamentos({ equipamentos }: { equipamentos: EquipamentoRanking[] }) {
  return (
    <section aria-labelledby="titulo-ranking">
      <h2 id="titulo-ranking" className="mb-1 font-semibold text-slate-900">
        Equipamentos com mais chamados
      </h2>
      <p className="mb-3 text-sm text-slate-600">
        Os 10 que mais quebraram no período. Abra um para ver o histórico de defeitos.
      </p>
      {equipamentos.length === 0 ? (
        <EstadoVazio mensagem="Nenhum chamado com equipamento no período." />
      ) : (
        <Tabela
          legenda="Equipamentos com mais chamados"
          colunas={colunas}
          itens={equipamentos.map((item, indice) => ({ ...item, posicao: indice + 1 }))}
          chave={(item) => item.id}
        />
      )}
    </section>
  );
}
