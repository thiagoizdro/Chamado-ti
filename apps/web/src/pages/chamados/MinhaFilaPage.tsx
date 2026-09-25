import { useState } from 'react';
import { useNavigate } from 'react-router';

import { ListaDeChamados } from '../../components/chamados/ListaDeChamados';
import { Alerta } from '../../components/ui/Alerta';
import { Botao } from '../../components/ui/Botao';
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina';
import type { Coluna } from '../../components/ui/Tabela';
import { useAuth } from '../../hooks/useAuth';
import { useAssumirChamado, useListaChamados } from '../../hooks/useChamados';
import { mensagemDoErro } from '../../lib/api';
import type { ChamadoResumo } from '../../types/chamado';

const POR_PAGINA = 10;

// Fila do técnico: primeiro o que já está com ele, depois o que ninguém
// assumiu. As duas listas vêm em ordem de fila (mais urgente e mais antigo primeiro).
export default function MinhaFilaPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [paginaMeus, setPaginaMeus] = useState(1);
  const [paginaSemTecnico, setPaginaSemTecnico] = useState(1);

  const meus = useListaChamados({
    tecnicoId: usuario?.id,
    status: 'EM_ATENDIMENTO,AGUARDANDO_PECA',
    ordem: 'prioridade',
    pagina: paginaMeus,
    porPagina: POR_PAGINA,
  });
  const semTecnico = useListaChamados({
    status: 'ABERTO',
    ordem: 'prioridade',
    pagina: paginaSemTecnico,
    porPagina: POR_PAGINA,
  });

  const assumir = useAssumirChamado();

  async function aoAssumir(id: number) {
    try {
      await assumir.mutateAsync(id);
      navigate(`/chamados/${id}`, { state: { mensagem: 'Chamado assumido.' } });
    } catch {
      // O erro (ex.: outro técnico assumiu antes) aparece no alerta acima da lista.
    }
  }

  const colunaAssumir: Coluna<ChamadoResumo> = {
    titulo: 'Ações',
    className: 'text-right',
    celula: (chamado) => (
      <Botao
        variante="discreto"
        onClick={() => void aoAssumir(chamado.id)}
        disabled={assumir.isPending}
        aria-label={`Assumir o chamado #${chamado.id}`}
      >
        Assumir
      </Botao>
    ),
  };

  return (
    <section className="space-y-8">
      <CabecalhoPagina
        titulo="Minha fila"
        descricao="Seus chamados em andamento e os que ainda aguardam um técnico."
      />

      <section aria-labelledby="titulo-meus">
        <h2 id="titulo-meus" className="mb-3 text-lg font-semibold text-slate-900">
          Em andamento comigo
        </h2>
        <ListaDeChamados
          consulta={meus}
          legenda="Chamados em andamento comigo"
          mensagemVazio="Nenhum chamado em andamento com você."
          aoMudarPagina={setPaginaMeus}
        />
      </section>

      <section aria-labelledby="titulo-sem-tecnico">
        <h2 id="titulo-sem-tecnico" className="mb-3 text-lg font-semibold text-slate-900">
          Aguardando técnico
        </h2>
        {assumir.isError && (
          <div className="mb-3">
            <Alerta tipo="erro">
              {mensagemDoErro(assumir.error, 'Não foi possível assumir o chamado.')}
            </Alerta>
          </div>
        )}
        <ListaDeChamados
          consulta={semTecnico}
          legenda="Chamados aguardando técnico"
          mensagemVazio="Nenhum chamado aguardando técnico. Bom trabalho!"
          aoMudarPagina={setPaginaSemTecnico}
          colunaExtra={colunaAssumir}
        />
      </section>
    </section>
  );
}
