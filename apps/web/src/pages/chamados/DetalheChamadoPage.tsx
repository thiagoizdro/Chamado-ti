import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';

import { AcoesDoChamado } from '../../components/chamados/AcoesDoChamado';
import { FormularioComentario } from '../../components/chamados/FormularioComentario';
import { LinhaDoTempo } from '../../components/chamados/LinhaDoTempo';
import { BadgePrioridade, BadgeStatus } from '../../components/BadgesChamado';
import { Alerta } from '../../components/ui/Alerta';
import { LinkBotao } from '../../components/ui/Botao';
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina';
import { EstadoCarregando, EstadoErro } from '../../components/ui/Estados';
import { classeFoco } from '../../components/ui/estilos';
import { useAuth } from '../../hooks/useAuth';
import { useChamado } from '../../hooks/useChamados';
import { useMensagemDaNavegacao } from '../../hooks/useMensagemDaNavegacao';
import { mensagemDoErro } from '../../lib/api';
import { formatarDataHora } from '../../lib/datas';
import type { ChamadoDetalhe } from '../../types/chamado';

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-slate-600">{rotulo}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{children}</dd>
    </div>
  );
}

// Técnico/admin abrem o detalhe do equipamento; o solicitante só vê o patrimônio.
function Equipamento({ chamado, comLink }: { chamado: ChamadoDetalhe; comLink: boolean }) {
  const { equipamento } = chamado;
  if (!equipamento) return <>—</>;
  const texto = `${equipamento.patrimonio} (${equipamento.tipo})`;
  if (!comLink) return <>{texto}</>;
  return (
    <Link
      to={`/equipamentos/${equipamento.id}`}
      className={`text-blue-800 underline-offset-2 hover:underline ${classeFoco}`}
    >
      {texto}
    </Link>
  );
}

export default function DetalheChamadoPage() {
  const id = Number(useParams().id);
  const { usuario } = useAuth();
  const equipeTecnica = usuario?.perfil === 'TECNICO' || usuario?.perfil === 'ADMIN';
  const consulta = useChamado(id);
  const mensagemDaNavegacao = useMensagemDaNavegacao();

  if (consulta.isPending) return <EstadoCarregando />;
  if (consulta.isError) {
    return <EstadoErro mensagem={mensagemDoErro(consulta.error, 'Chamado não encontrado.')} />;
  }

  const chamado = consulta.data;
  const resolvido = chamado.status === 'RESOLVIDO';

  return (
    <section>
      <CabecalhoPagina
        titulo={`#${chamado.id} · ${chamado.titulo}`}
        acoes={
          <LinkBotao variante="secundario" to="/chamados">
            Voltar
          </LinkBotao>
        }
      />

      {mensagemDaNavegacao && (
        <div className="mb-4">
          <Alerta tipo="sucesso">{mensagemDaNavegacao}</Alerta>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg bg-white p-6 ring-1 ring-slate-200">
            <div className="flex flex-wrap gap-2">
              <BadgeStatus status={chamado.status} />
              <BadgePrioridade prioridade={chamado.prioridade} />
            </div>
            <h2 className="mt-4 text-sm font-medium text-slate-600">Descrição</h2>
            <p className="mt-1 whitespace-pre-line text-slate-900">{chamado.descricao}</p>

            {chamado.solucao && (
              <div className="mt-4 rounded-md bg-green-50 px-4 py-3 ring-1 ring-green-200">
                <h2 className="text-sm font-medium text-green-900">Solução</h2>
                <p className="mt-1 whitespace-pre-line text-green-900">{chamado.solucao}</p>
              </div>
            )}
          </div>

          {equipeTecnica && <AcoesDoChamado chamado={chamado} />}

          <section
            aria-labelledby="titulo-historico"
            className="rounded-lg bg-white p-6 ring-1 ring-slate-200"
          >
            <h2 id="titulo-historico" className="mb-4 text-lg font-semibold text-slate-900">
              Histórico
            </h2>
            <LinhaDoTempo historico={chamado.historico} />
            {resolvido ? (
              <p className="mt-6 text-sm text-slate-600">
                Chamado resolvido: não recebe novos comentários.
              </p>
            ) : (
              <FormularioComentario chamadoId={chamado.id} />
            )}
          </section>
        </div>

        <dl className="h-fit space-y-4 rounded-lg bg-white p-6 ring-1 ring-slate-200">
          <Dado rotulo="Escola">{chamado.escola.nome}</Dado>
          <Dado rotulo="Categoria">{chamado.categoria.nome}</Dado>
          <Dado rotulo="Equipamento">
            <Equipamento chamado={chamado} comLink={equipeTecnica} />
          </Dado>
          <Dado rotulo="Solicitante">{chamado.solicitante.nome}</Dado>
          <Dado rotulo="Técnico">{chamado.tecnico?.nome ?? 'Aguardando técnico'}</Dado>
          <Dado rotulo="Aberto em">{formatarDataHora(chamado.abertoEm)}</Dado>
          {chamado.resolvidoEm && (
            <Dado rotulo="Resolvido em">{formatarDataHora(chamado.resolvidoEm)}</Dado>
          )}
        </dl>
      </div>
    </section>
  );
}
