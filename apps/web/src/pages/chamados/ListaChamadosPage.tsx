import { FiltrosChamados } from '../../components/chamados/FiltrosChamados';
import { ListaDeChamados } from '../../components/chamados/ListaDeChamados';
import { Alerta } from '../../components/ui/Alerta';
import { LinkBotao } from '../../components/ui/Botao';
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina';
import { useAuth } from '../../hooks/useAuth';
import { useListaChamados } from '../../hooks/useChamados';
import { useMensagemDaNavegacao } from '../../hooks/useMensagemDaNavegacao';
import { useParametrosLista } from '../../hooks/useParametrosLista';
import { type NomeFiltro, NOMES_FILTROS } from '../../lib/chamados';
import { SOLICITANTE_E_ADMIN } from '../../lib/navegacao';
import type { ParametrosLista } from '../../types/paginacao';

// Busca, filtros e página ficam na URL (useSearchParams): sobrevivem ao F5,
// ao botão voltar e podem ser compartilhados por link.
export default function ListaChamadosPage() {
  const { usuario } = useAuth();
  const ehSolicitante = usuario?.perfil === 'SOLICITANTE';
  const podeAbrir = usuario !== null && SOLICITANTE_E_ADMIN.includes(usuario.perfil);

  const { pagina, busca, filtro, mudarPagina, mudarBusca, mudarFiltro, limparFiltros } =
    useParametrosLista();

  const filtros: ParametrosLista = Object.fromEntries(
    NOMES_FILTROS.map((nome) => [nome, filtro(nome) || undefined]),
  );
  // Período invertido: o campo mostra o erro e a lista ignora as datas até corrigir.
  if (filtros.de && filtros.ate && filtros.de > filtros.ate) {
    filtros.de = undefined;
    filtros.ate = undefined;
  }
  const temFiltros = Boolean(busca) || NOMES_FILTROS.some((nome) => filtro(nome));

  const consulta = useListaChamados({ ...filtros, q: busca || undefined, pagina });
  const mensagemDaNavegacao = useMensagemDaNavegacao();

  if (!usuario) return null;

  return (
    <section>
      <CabecalhoPagina
        titulo="Chamados"
        descricao={
          ehSolicitante
            ? `Chamados abertos pela ${usuario.escola?.nome ?? 'sua escola'}.`
            : 'Chamados de todas as escolas da rede, dos mais recentes para os mais antigos.'
        }
        acoes={podeAbrir && <LinkBotao to="/chamados/novo">Abrir chamado</LinkBotao>}
      />

      {mensagemDaNavegacao && (
        <div className="mb-4">
          <Alerta tipo="sucesso">{mensagemDaNavegacao}</Alerta>
        </div>
      )}

      <FiltrosChamados
        usuario={usuario}
        busca={busca}
        valor={(nome: NomeFiltro) => filtro(nome)}
        aoBuscar={mudarBusca}
        aoMudar={mudarFiltro}
        temFiltros={temFiltros}
        aoLimpar={limparFiltros}
      />

      <ListaDeChamados
        consulta={consulta}
        legenda="Chamados"
        mensagemVazio={
          temFiltros
            ? 'Nenhum chamado encontrado com esses filtros.'
            : ehSolicitante
              ? 'Sua escola ainda não abriu chamados.'
              : 'Nenhum chamado encontrado.'
        }
        aoMudarPagina={mudarPagina}
        mostrarEscola={!ehSolicitante}
      />
    </section>
  );
}
