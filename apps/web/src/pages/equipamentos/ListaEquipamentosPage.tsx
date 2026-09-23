import { Link } from 'react-router';

import { AcoesDaLinha } from '../../components/AcoesDaLinha';
import { ListaPaginada } from '../../components/ListaPaginada';
import { Alerta } from '../../components/ui/Alerta';
import { BadgeAtivo } from '../../components/ui/BadgeAtivo';
import { LinkBotao } from '../../components/ui/Botao';
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina';
import { CampoSelect } from '../../components/ui/Campo';
import { CampoBusca } from '../../components/ui/CampoBusca';
import { DialogoConfirmacao } from '../../components/ui/DialogoConfirmacao';
import { classeFoco } from '../../components/ui/estilos';
import { FiltroAtivo } from '../../components/ui/FiltroAtivo';
import type { Coluna } from '../../components/ui/Tabela';
import { useAlternarAtivo } from '../../hooks/useAlternarAtivo';
import { useAuth } from '../../hooks/useAuth';
import {
  useDesativarEquipamento,
  useListaEquipamentos,
  useSalvarEquipamento,
} from '../../hooks/useEquipamentos';
import { useMensagemDaNavegacao } from '../../hooks/useMensagemDaNavegacao';
import { useOpcoesEscolas } from '../../hooks/useOpcoesEscolas';
import { useParametrosLista } from '../../hooks/useParametrosLista';
import { dadosDoEquipamento } from '../../services/equipamentos.service';
import type { Equipamento } from '../../types/cadastros';

// Filtro por escola só para o admin: a lista de escolas (GET /escolas) é só dele.
function FiltroEscola({ valor, aoMudar }: { valor: string; aoMudar: (valor: string) => void }) {
  const escolas = useOpcoesEscolas();
  return (
    <div className="w-full sm:w-64">
      <CampoSelect
        id="filtro-escola"
        rotulo="Escola"
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
      >
        <option value="">Todas</option>
        {escolas.opcoes.map((escola) => (
          <option key={escola.id} value={escola.id}>
            {escola.nome}
          </option>
        ))}
      </CampoSelect>
    </div>
  );
}

export default function ListaEquipamentosPage() {
  const { usuario } = useAuth();
  const ehAdmin = usuario?.perfil === 'ADMIN';

  const { pagina, busca, ativo, filtro, mudarPagina, mudarBusca, mudarAtivo, mudarFiltro } =
    useParametrosLista();
  const escolaId = filtro('escolaId');
  const consulta = useListaEquipamentos({
    pagina,
    q: busca || undefined,
    ativo,
    escolaId: escolaId || undefined,
  });
  const mensagemDaNavegacao = useMensagemDaNavegacao();

  const ativacao = useAlternarAtivo({
    salvar: useSalvarEquipamento(),
    desativar: useDesativarEquipamento(),
    paraDados: dadosDoEquipamento,
    textos: { desativado: 'Equipamento desativado.', reativado: 'Equipamento reativado.' },
  });

  const colunas: Coluna<Equipamento>[] = [
    {
      titulo: 'Patrimônio',
      celula: (equipamento) => (
        <Link
          to={`/equipamentos/${equipamento.id}`}
          className={`font-medium text-blue-800 underline-offset-2 hover:underline ${classeFoco}`}
        >
          {equipamento.patrimonio}
        </Link>
      ),
    },
    { titulo: 'Tipo', celula: (equipamento) => equipamento.tipo },
    {
      titulo: 'Marca / modelo',
      celula: (equipamento) =>
        [equipamento.marca, equipamento.modelo].filter(Boolean).join(' ') || '—',
    },
    { titulo: 'Escola', celula: (equipamento) => equipamento.escola.nome },
    { titulo: 'Localização', celula: (equipamento) => equipamento.localizacao ?? '—' },
    { titulo: 'Situação', celula: (equipamento) => <BadgeAtivo ativo={equipamento.ativo} /> },
  ];

  if (ehAdmin) {
    colunas.push({
      titulo: 'Ações',
      className: 'text-right',
      celula: (equipamento) => (
        <AcoesDaLinha
          nome={equipamento.patrimonio}
          ativo={equipamento.ativo}
          linkEditar={`/equipamentos/${equipamento.id}/editar`}
          processando={ativacao.processando}
          aoDesativar={() => ativacao.pedirDesativacao(equipamento)}
          aoReativar={() => void ativacao.reativar(equipamento)}
        />
      ),
    });
  }

  const mensagem =
    ativacao.mensagem ?? (mensagemDaNavegacao && { tipo: 'sucesso', texto: mensagemDaNavegacao });

  return (
    <section>
      <CabecalhoPagina
        titulo="Equipamentos"
        descricao="Parque de equipamentos das escolas. Abra um item para ver o histórico de defeitos."
        acoes={ehAdmin && <LinkBotao to="/equipamentos/novo">Novo equipamento</LinkBotao>}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <CampoBusca
          id="busca-equipamentos"
          rotulo="Buscar"
          placeholder="Patrimônio, tipo, marca ou modelo"
          valor={busca}
          aoBuscar={mudarBusca}
        />
        {ehAdmin && (
          <FiltroEscola valor={escolaId} aoMudar={(valor) => mudarFiltro('escolaId', valor)} />
        )}
        <FiltroAtivo valor={ativo} aoMudar={mudarAtivo} />
      </div>

      {mensagem && (
        <div className="mb-4">
          <Alerta tipo={mensagem.tipo}>{mensagem.texto}</Alerta>
        </div>
      )}

      <ListaPaginada
        consulta={consulta}
        legenda="Equipamentos"
        colunas={colunas}
        chave={(equipamento) => equipamento.id}
        mensagemVazio="Nenhum equipamento encontrado."
        mensagemErro="Não foi possível carregar os equipamentos."
        aoMudarPagina={mudarPagina}
      />

      <DialogoConfirmacao
        aberto={ativacao.paraDesativar !== null}
        titulo="Desativar equipamento"
        mensagem={`O equipamento ${ativacao.paraDesativar?.patrimonio ?? ''} não poderá mais ser escolhido em novos chamados. O histórico de defeitos é mantido.`}
        textoConfirmar="Desativar"
        perigoso
        processando={ativacao.processando}
        aoConfirmar={() => void ativacao.confirmarDesativacao()}
        aoCancelar={ativacao.cancelarDesativacao}
      />
    </section>
  );
}
