import { AcoesDaLinha } from '../../components/AcoesDaLinha';
import { Alerta } from '../../components/ui/Alerta';
import { BadgeAtivo } from '../../components/ui/BadgeAtivo';
import { LinkBotao } from '../../components/ui/Botao';
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina';
import { CampoBusca } from '../../components/ui/CampoBusca';
import { DialogoConfirmacao } from '../../components/ui/DialogoConfirmacao';
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../components/ui/Estados';
import { FiltroAtivo } from '../../components/ui/FiltroAtivo';
import { Paginacao } from '../../components/ui/Paginacao';
import { type Coluna, Tabela } from '../../components/ui/Tabela';
import { useAlternarAtivo } from '../../hooks/useAlternarAtivo';
import { useDesativarEscola, useListaEscolas, useSalvarEscola } from '../../hooks/useEscolas';
import { useMensagemDaNavegacao } from '../../hooks/useMensagemDaNavegacao';
import { useParametrosLista } from '../../hooks/useParametrosLista';
import { mensagemDoErro } from '../../lib/api';
import { dadosDaEscola } from '../../services/escolas.service';
import type { Escola } from '../../types/cadastros';

export default function ListaEscolasPage() {
  const { pagina, busca, ativo, mudarPagina, mudarBusca, mudarAtivo } = useParametrosLista();
  const consulta = useListaEscolas({ pagina, q: busca || undefined, ativo });
  const mensagemDaNavegacao = useMensagemDaNavegacao();

  const ativacao = useAlternarAtivo({
    salvar: useSalvarEscola(),
    desativar: useDesativarEscola(),
    paraDados: dadosDaEscola,
    textos: { desativado: 'Escola desativada.', reativado: 'Escola reativada.' },
  });

  const colunas: Coluna<Escola>[] = [
    { titulo: 'Nome', celula: (escola) => <span className="font-medium">{escola.nome}</span> },
    { titulo: 'INEP', celula: (escola) => escola.codigoInep ?? '—' },
    { titulo: 'Endereço', celula: (escola) => escola.endereco ?? '—' },
    { titulo: 'Situação', celula: (escola) => <BadgeAtivo ativo={escola.ativo} /> },
    {
      titulo: 'Ações',
      className: 'text-right',
      celula: (escola) => (
        <AcoesDaLinha
          nome={escola.nome}
          ativo={escola.ativo}
          linkEditar={`/escolas/${escola.id}/editar`}
          processando={ativacao.processando}
          aoDesativar={() => ativacao.pedirDesativacao(escola)}
          aoReativar={() => void ativacao.reativar(escola)}
        />
      ),
    },
  ];

  const mensagem =
    ativacao.mensagem ?? (mensagemDaNavegacao && { tipo: 'sucesso', texto: mensagemDaNavegacao });

  return (
    <section>
      <CabecalhoPagina
        titulo="Escolas"
        descricao="Unidades da rede que podem abrir chamados."
        acoes={<LinkBotao to="/escolas/novo">Nova escola</LinkBotao>}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <CampoBusca
          id="busca-escolas"
          rotulo="Buscar"
          placeholder="Nome ou código INEP"
          valor={busca}
          aoBuscar={mudarBusca}
        />
        <FiltroAtivo valor={ativo} aoMudar={mudarAtivo} />
      </div>

      {mensagem && (
        <div className="mb-4">
          <Alerta tipo={mensagem.tipo}>{mensagem.texto}</Alerta>
        </div>
      )}

      {consulta.isPending ? (
        <EstadoCarregando />
      ) : consulta.isError ? (
        <EstadoErro
          mensagem={mensagemDoErro(consulta.error, 'Não foi possível carregar as escolas.')}
          aoTentarNovamente={() => void consulta.refetch()}
        />
      ) : consulta.data.dados.length === 0 ? (
        <EstadoVazio mensagem="Nenhuma escola encontrada." />
      ) : (
        <>
          <Tabela
            legenda="Escolas"
            colunas={colunas}
            itens={consulta.data.dados}
            chave={(escola) => escola.id}
          />
          <Paginacao
            pagina={consulta.data.pagina}
            porPagina={consulta.data.porPagina}
            total={consulta.data.total}
            aoMudarPagina={mudarPagina}
          />
        </>
      )}

      <DialogoConfirmacao
        aberto={ativacao.paraDesativar !== null}
        titulo="Desativar escola"
        mensagem={`A escola "${ativacao.paraDesativar?.nome ?? ''}" deixará de aparecer nos cadastros. O histórico de chamados é mantido.`}
        textoConfirmar="Desativar"
        perigoso
        processando={ativacao.processando}
        aoConfirmar={() => void ativacao.confirmarDesativacao()}
        aoCancelar={ativacao.cancelarDesativacao}
      />
    </section>
  );
}
