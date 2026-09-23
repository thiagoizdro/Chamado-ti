import { AcoesDaLinha } from '../../components/AcoesDaLinha';
import { ListaPaginada } from '../../components/ListaPaginada';
import { Alerta } from '../../components/ui/Alerta';
import { BadgeAtivo } from '../../components/ui/BadgeAtivo';
import { LinkBotao } from '../../components/ui/Botao';
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina';
import { CampoSelect } from '../../components/ui/Campo';
import { CampoBusca } from '../../components/ui/CampoBusca';
import { DialogoConfirmacao } from '../../components/ui/DialogoConfirmacao';
import { FiltroAtivo } from '../../components/ui/FiltroAtivo';
import type { Coluna } from '../../components/ui/Tabela';
import { useAlternarAtivo } from '../../hooks/useAlternarAtivo';
import { useAuth } from '../../hooks/useAuth';
import { useMensagemDaNavegacao } from '../../hooks/useMensagemDaNavegacao';
import { useParametrosLista } from '../../hooks/useParametrosLista';
import { useDesativarUsuario, useListaUsuarios, useSalvarUsuario } from '../../hooks/useUsuarios';
import { ROTULO_PERFIL } from '../../lib/navegacao';
import { dadosDoUsuario } from '../../services/usuarios.service';
import type { Usuario } from '../../types/cadastros';

export default function ListaUsuariosPage() {
  const { usuario: eu } = useAuth();
  const { pagina, busca, ativo, filtro, mudarPagina, mudarBusca, mudarAtivo, mudarFiltro } =
    useParametrosLista();
  const perfil = filtro('perfil');
  const consulta = useListaUsuarios({
    pagina,
    q: busca || undefined,
    ativo,
    perfil: perfil || undefined,
  });
  const mensagemDaNavegacao = useMensagemDaNavegacao();

  const ativacao = useAlternarAtivo({
    salvar: useSalvarUsuario(),
    desativar: useDesativarUsuario(),
    paraDados: dadosDoUsuario,
    textos: { desativado: 'Usuário desativado.', reativado: 'Usuário reativado.' },
  });

  const colunas: Coluna<Usuario>[] = [
    { titulo: 'Nome', celula: (usuario) => <span className="font-medium">{usuario.nome}</span> },
    { titulo: 'E-mail', celula: (usuario) => usuario.email },
    { titulo: 'Perfil', celula: (usuario) => ROTULO_PERFIL[usuario.perfil] },
    { titulo: 'Escola', celula: (usuario) => usuario.escola?.nome ?? '—' },
    { titulo: 'Situação', celula: (usuario) => <BadgeAtivo ativo={usuario.ativo} /> },
    {
      titulo: 'Ações',
      className: 'text-right',
      celula: (usuario) => (
        <AcoesDaLinha
          nome={usuario.nome}
          ativo={usuario.ativo}
          linkEditar={`/usuarios/${usuario.id}/editar`}
          processando={ativacao.processando}
          podeDesativar={usuario.id !== eu?.id}
          aoDesativar={() => ativacao.pedirDesativacao(usuario)}
          aoReativar={() => void ativacao.reativar(usuario)}
        />
      ),
    },
  ];

  const mensagem =
    ativacao.mensagem ?? (mensagemDaNavegacao && { tipo: 'sucesso', texto: mensagemDaNavegacao });

  return (
    <section>
      <CabecalhoPagina
        titulo="Usuários"
        descricao="Pessoas com acesso ao sistema e seus perfis."
        acoes={<LinkBotao to="/usuarios/novo">Novo usuário</LinkBotao>}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <CampoBusca
          id="busca-usuarios"
          rotulo="Buscar"
          placeholder="Nome ou e-mail"
          valor={busca}
          aoBuscar={mudarBusca}
        />
        <div className="w-full sm:w-44">
          <CampoSelect
            id="filtro-perfil"
            rotulo="Perfil"
            value={perfil}
            onChange={(evento) => mudarFiltro('perfil', evento.target.value)}
          >
            <option value="">Todos</option>
            <option value="SOLICITANTE">{ROTULO_PERFIL.SOLICITANTE}</option>
            <option value="TECNICO">{ROTULO_PERFIL.TECNICO}</option>
            <option value="ADMIN">{ROTULO_PERFIL.ADMIN}</option>
          </CampoSelect>
        </div>
        <FiltroAtivo valor={ativo} aoMudar={mudarAtivo} />
      </div>

      {mensagem && (
        <div className="mb-4">
          <Alerta tipo={mensagem.tipo}>{mensagem.texto}</Alerta>
        </div>
      )}

      <ListaPaginada
        consulta={consulta}
        legenda="Usuários"
        colunas={colunas}
        chave={(usuario) => usuario.id}
        mensagemVazio="Nenhum usuário encontrado."
        mensagemErro="Não foi possível carregar os usuários."
        aoMudarPagina={mudarPagina}
      />

      <DialogoConfirmacao
        aberto={ativacao.paraDesativar !== null}
        titulo="Desativar usuário"
        mensagem={`"${ativacao.paraDesativar?.nome ?? ''}" não conseguirá mais entrar no sistema. O histórico de chamados é mantido.`}
        textoConfirmar="Desativar"
        perigoso
        processando={ativacao.processando}
        aoConfirmar={() => void ativacao.confirmarDesativacao()}
        aoCancelar={ativacao.cancelarDesativacao}
      />
    </section>
  );
}
