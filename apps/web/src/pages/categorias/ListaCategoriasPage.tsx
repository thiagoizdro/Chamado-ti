import { AcoesDaLinha } from '../../components/AcoesDaLinha';
import { ListaPaginada } from '../../components/ListaPaginada';
import { Alerta } from '../../components/ui/Alerta';
import { BadgeAtivo } from '../../components/ui/BadgeAtivo';
import { LinkBotao } from '../../components/ui/Botao';
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina';
import { CampoBusca } from '../../components/ui/CampoBusca';
import { DialogoConfirmacao } from '../../components/ui/DialogoConfirmacao';
import { FiltroAtivo } from '../../components/ui/FiltroAtivo';
import type { Coluna } from '../../components/ui/Tabela';
import { useAlternarAtivo } from '../../hooks/useAlternarAtivo';
import {
  useDesativarCategoria,
  useListaCategorias,
  useSalvarCategoria,
} from '../../hooks/useCategorias';
import { useMensagemDaNavegacao } from '../../hooks/useMensagemDaNavegacao';
import { useParametrosLista } from '../../hooks/useParametrosLista';
import { dadosDaCategoria } from '../../services/categorias.service';
import type { Categoria } from '../../types/cadastros';

export default function ListaCategoriasPage() {
  const { pagina, busca, ativo, mudarPagina, mudarBusca, mudarAtivo } = useParametrosLista();
  const consulta = useListaCategorias({ pagina, q: busca || undefined, ativo });
  const mensagemDaNavegacao = useMensagemDaNavegacao();

  const ativacao = useAlternarAtivo({
    salvar: useSalvarCategoria(),
    desativar: useDesativarCategoria(),
    paraDados: dadosDaCategoria,
    textos: { desativado: 'Categoria desativada.', reativado: 'Categoria reativada.' },
  });

  const colunas: Coluna<Categoria>[] = [
    {
      titulo: 'Nome',
      celula: (categoria) => <span className="font-medium">{categoria.nome}</span>,
    },
    { titulo: 'Situação', celula: (categoria) => <BadgeAtivo ativo={categoria.ativo} /> },
    {
      titulo: 'Ações',
      className: 'text-right',
      celula: (categoria) => (
        <AcoesDaLinha
          nome={categoria.nome}
          ativo={categoria.ativo}
          linkEditar={`/categorias/${categoria.id}/editar`}
          processando={ativacao.processando}
          aoDesativar={() => ativacao.pedirDesativacao(categoria)}
          aoReativar={() => void ativacao.reativar(categoria)}
        />
      ),
    },
  ];

  const mensagem =
    ativacao.mensagem ?? (mensagemDaNavegacao && { tipo: 'sucesso', texto: mensagemDaNavegacao });

  return (
    <section>
      <CabecalhoPagina
        titulo="Categorias"
        descricao="Tipos de problema usados na abertura de chamados."
        acoes={<LinkBotao to="/categorias/novo">Nova categoria</LinkBotao>}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <CampoBusca
          id="busca-categorias"
          rotulo="Buscar"
          placeholder="Nome da categoria"
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

      <ListaPaginada
        consulta={consulta}
        legenda="Categorias"
        colunas={colunas}
        chave={(categoria) => categoria.id}
        mensagemVazio="Nenhuma categoria encontrada."
        mensagemErro="Não foi possível carregar as categorias."
        aoMudarPagina={mudarPagina}
      />

      <DialogoConfirmacao
        aberto={ativacao.paraDesativar !== null}
        titulo="Desativar categoria"
        mensagem={`A categoria "${ativacao.paraDesativar?.nome ?? ''}" não poderá mais ser escolhida em novos chamados. Os chamados antigos continuam com ela.`}
        textoConfirmar="Desativar"
        perigoso
        processando={ativacao.processando}
        aoConfirmar={() => void ativacao.confirmarDesativacao()}
        aoCancelar={ativacao.cancelarDesativacao}
      />
    </section>
  );
}
