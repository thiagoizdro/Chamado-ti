import type { UseQueryResult } from '@tanstack/react-query';
import { Link } from 'react-router';

import { formatarDataHora } from '../../lib/datas';
import type { ChamadoResumo } from '../../types/chamado';
import type { RespostaPaginada } from '../../types/paginacao';
import { BadgePrioridade, BadgeStatus } from '../BadgesChamado';
import { ListaPaginada } from '../ListaPaginada';
import { classeFoco } from '../ui/estilos';
import type { Coluna } from '../ui/Tabela';

type Props = {
  consulta: UseQueryResult<RespostaPaginada<ChamadoResumo>>;
  legenda: string;
  mensagemVazio: string;
  aoMudarPagina: (pagina: number) => void;
  // O solicitante só vê a própria escola: a coluna seria sempre igual.
  mostrarEscola?: boolean;
  colunaExtra?: Coluna<ChamadoResumo>;
};

export function ListaDeChamados({
  consulta,
  legenda,
  mensagemVazio,
  aoMudarPagina,
  mostrarEscola = true,
  colunaExtra,
}: Props) {
  const colunas: Coluna<ChamadoResumo>[] = [
    {
      titulo: 'Chamado',
      celula: (chamado) => (
        <div>
          <Link
            to={`/chamados/${chamado.id}`}
            className={`font-medium text-blue-800 underline-offset-2 hover:underline ${classeFoco}`}
          >
            #{chamado.id} · {chamado.titulo}
          </Link>
          <p className="mt-0.5 text-slate-600">
            {chamado.categoria.nome}
            {chamado.equipamento && ` · ${chamado.equipamento.patrimonio}`}
          </p>
        </div>
      ),
    },
    ...(mostrarEscola
      ? [{ titulo: 'Escola', celula: (chamado: ChamadoResumo) => chamado.escola.nome }]
      : []),
    {
      titulo: 'Prioridade',
      celula: (chamado) => <BadgePrioridade prioridade={chamado.prioridade} />,
    },
    { titulo: 'Status', celula: (chamado) => <BadgeStatus status={chamado.status} /> },
    { titulo: 'Técnico', celula: (chamado) => chamado.tecnico?.nome ?? '—' },
    {
      titulo: 'Aberto em',
      className: 'whitespace-nowrap',
      celula: (chamado) => formatarDataHora(chamado.abertoEm),
    },
    ...(colunaExtra ? [colunaExtra] : []),
  ];

  return (
    <ListaPaginada
      consulta={consulta}
      legenda={legenda}
      colunas={colunas}
      chave={(chamado) => chamado.id}
      mensagemVazio={mensagemVazio}
      mensagemErro="Não foi possível carregar os chamados."
      aoMudarPagina={aoMudarPagina}
    />
  );
}
