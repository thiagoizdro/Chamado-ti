import type { ReactNode } from 'react';
import { useParams } from 'react-router';

import { BadgePrioridade, BadgeStatus } from '../../components/BadgesChamado';
import { ListaPaginada } from '../../components/ListaPaginada';
import { Alerta } from '../../components/ui/Alerta';
import { BadgeAtivo } from '../../components/ui/BadgeAtivo';
import { LinkBotao } from '../../components/ui/Botao';
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina';
import { EstadoCarregando, EstadoErro } from '../../components/ui/Estados';
import type { Coluna } from '../../components/ui/Tabela';
import { useAuth } from '../../hooks/useAuth';
import { useChamadosDoEquipamento, useEquipamento } from '../../hooks/useEquipamentos';
import { useMensagemDaNavegacao } from '../../hooks/useMensagemDaNavegacao';
import { useParametrosLista } from '../../hooks/useParametrosLista';
import { mensagemDoErro } from '../../lib/api';
import { formatarDataHora } from '../../lib/datas';
import type { ChamadoDoEquipamento } from '../../types/chamado';

const CHAMADOS_POR_PAGINA = 10;

const colunas: Coluna<ChamadoDoEquipamento>[] = [
  {
    titulo: 'Aberto em',
    className: 'whitespace-nowrap',
    celula: (chamado) => formatarDataHora(chamado.abertoEm),
  },
  {
    titulo: 'Chamado',
    celula: (chamado) => (
      <div>
        <p className="font-medium">
          #{chamado.id} · {chamado.titulo}
        </p>
        {chamado.solucao && <p className="mt-0.5 text-slate-600">Solução: {chamado.solucao}</p>}
      </div>
    ),
  },
  { titulo: 'Categoria', celula: (chamado) => chamado.categoria.nome },
  {
    titulo: 'Prioridade',
    celula: (chamado) => <BadgePrioridade prioridade={chamado.prioridade} />,
  },
  { titulo: 'Status', celula: (chamado) => <BadgeStatus status={chamado.status} /> },
  { titulo: 'Técnico', celula: (chamado) => chamado.tecnico?.nome ?? '—' },
  {
    titulo: 'Resolvido em',
    className: 'whitespace-nowrap',
    celula: (chamado) => (chamado.resolvidoEm ? formatarDataHora(chamado.resolvidoEm) : '—'),
  },
];

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-slate-600">{rotulo}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export default function DetalheEquipamentoPage() {
  const id = Number(useParams().id);
  const { usuario } = useAuth();
  const { pagina, mudarPagina } = useParametrosLista();
  const mensagemDaNavegacao = useMensagemDaNavegacao();

  const equipamento = useEquipamento(id);
  const chamados = useChamadosDoEquipamento(id, { pagina, porPagina: CHAMADOS_POR_PAGINA });

  if (equipamento.isPending) return <EstadoCarregando />;
  if (equipamento.isError) {
    return (
      <EstadoErro mensagem={mensagemDoErro(equipamento.error, 'Equipamento não encontrado.')} />
    );
  }

  const { patrimonio, tipo, marca, modelo, localizacao, escola, ativo, _count } = equipamento.data;

  return (
    <section>
      <CabecalhoPagina
        titulo={`Equipamento ${patrimonio}`}
        descricao={[tipo, marca, modelo].filter(Boolean).join(' · ')}
        acoes={
          <>
            <LinkBotao variante="secundario" to="/equipamentos">
              Voltar
            </LinkBotao>
            {usuario?.perfil === 'ADMIN' && (
              <LinkBotao to={`/equipamentos/${id}/editar`}>Editar</LinkBotao>
            )}
          </>
        }
      />

      {mensagemDaNavegacao && (
        <div className="mb-4">
          <Alerta tipo="sucesso">{mensagemDaNavegacao}</Alerta>
        </div>
      )}

      <dl className="grid gap-4 rounded-lg bg-white p-6 ring-1 ring-slate-200 sm:grid-cols-4">
        <Dado rotulo="Escola">{escola.nome}</Dado>
        <Dado rotulo="Localização">{localizacao ?? '—'}</Dado>
        <Dado rotulo="Situação">
          <BadgeAtivo ativo={ativo} />
        </Dado>
        <Dado rotulo="Total de chamados">{_count.chamados}</Dado>
      </dl>

      <h2 className="mt-8 mb-3 text-lg font-semibold text-slate-900">Histórico de chamados</h2>
      <ListaPaginada
        consulta={chamados}
        legenda={`Chamados do equipamento ${patrimonio}`}
        colunas={colunas}
        chave={(chamado) => chamado.id}
        mensagemVazio="Este equipamento ainda não teve chamados."
        mensagemErro="Não foi possível carregar os chamados do equipamento."
        aoMudarPagina={mudarPagina}
      />
    </section>
  );
}
