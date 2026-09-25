import { ListaDeChamados } from '../../components/chamados/ListaDeChamados';
import { Alerta } from '../../components/ui/Alerta';
import { LinkBotao } from '../../components/ui/Botao';
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina';
import { useAuth } from '../../hooks/useAuth';
import { useListaChamados } from '../../hooks/useChamados';
import { useMensagemDaNavegacao } from '../../hooks/useMensagemDaNavegacao';
import { useParametrosLista } from '../../hooks/useParametrosLista';
import { SOLICITANTE_E_ADMIN } from '../../lib/navegacao';

// Filtros e busca entram na Fase 5; por enquanto, lista paginada com escopo por perfil.
export default function ListaChamadosPage() {
  const { usuario } = useAuth();
  const ehSolicitante = usuario?.perfil === 'SOLICITANTE';
  const podeAbrir = usuario !== null && SOLICITANTE_E_ADMIN.includes(usuario.perfil);

  const { pagina, mudarPagina } = useParametrosLista();
  const consulta = useListaChamados({ pagina });
  const mensagemDaNavegacao = useMensagemDaNavegacao();

  return (
    <section>
      <CabecalhoPagina
        titulo="Chamados"
        descricao={
          ehSolicitante
            ? `Chamados abertos pela ${usuario?.escola?.nome ?? 'sua escola'}.`
            : 'Chamados de todas as escolas da rede, dos mais recentes para os mais antigos.'
        }
        acoes={podeAbrir && <LinkBotao to="/chamados/novo">Abrir chamado</LinkBotao>}
      />

      {mensagemDaNavegacao && (
        <div className="mb-4">
          <Alerta tipo="sucesso">{mensagemDaNavegacao}</Alerta>
        </div>
      )}

      <ListaDeChamados
        consulta={consulta}
        legenda="Chamados"
        mensagemVazio={
          ehSolicitante ? 'Sua escola ainda não abriu chamados.' : 'Nenhum chamado encontrado.'
        }
        aoMudarPagina={mudarPagina}
        mostrarEscola={!ehSolicitante}
      />
    </section>
  );
}
