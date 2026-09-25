import { CartaoIndicador } from '../components/dashboard/CartaoIndicador';
import { FiltrosDashboard } from '../components/dashboard/FiltrosDashboard';
import { GraficoBarras } from '../components/dashboard/GraficoBarras';
import { RankingEquipamentos } from '../components/dashboard/RankingEquipamentos';
import { CabecalhoPagina } from '../components/ui/CabecalhoPagina';
import { EstadoCarregando, EstadoErro } from '../components/ui/Estados';
import { useIndicadores } from '../hooks/useDashboard';
import { useParametrosLista } from '../hooks/useParametrosLista';
import { mensagemDoErro } from '../lib/api';
import { MARCADOR_STATUS, ROTULO_STATUS } from '../lib/chamados';
import { formatarNumero } from '../lib/datas';
import { datasDoPeriodo, lerPeriodo } from '../lib/periodos';
import type { StatusChamado } from '../types/chamado';
import type { Indicadores } from '../types/dashboard';

const STATUS: StatusChamado[] = ['ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_PECA', 'RESOLVIDO'];

function TempoMedio({ tempo }: { tempo: Indicadores['tempoMedioResolucao'] }) {
  if (tempo.horas === null) {
    return (
      <CartaoIndicador
        rotulo="Tempo médio de resolução"
        valor="—"
        detalhe="Nenhum chamado resolvido no período."
      />
    );
  }
  const { horas, chamadosResolvidos } = tempo;
  return (
    <CartaoIndicador
      rotulo="Tempo médio de resolução"
      valor={`${formatarNumero(horas)} h`}
      detalhe={
        <>
          {horas >= 24 && `≈ ${formatarNumero(horas / 24)} dias · `}
          média de {chamadosResolvidos} chamados fechados no período (pela data de resolução)
        </>
      }
    />
  );
}

function Indicadores({ dados, umaEscola }: { dados: Indicadores; umaEscola: boolean }) {
  const percentual = (quantidade: number) =>
    dados.total > 0 ? `${formatarNumero((quantidade / dados.total) * 100)}% do total` : undefined;

  return (
    <div className="space-y-6">
      <dl className="grid gap-4 sm:grid-cols-2">
        <CartaoIndicador rotulo="Chamados abertos no período" valor={String(dados.total)} />
        <TempoMedio tempo={dados.tempoMedioResolucao} />
      </dl>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATUS.map((status) => (
          <CartaoIndicador
            key={status}
            rotulo={ROTULO_STATUS[status]}
            valor={String(dados.porStatus[status])}
            detalhe={percentual(dados.porStatus[status])}
            marcador={MARCADOR_STATUS[status]}
          />
        ))}
      </dl>

      <div className={`grid items-start gap-6 ${umaEscola ? '' : 'lg:grid-cols-2'}`}>
        {/* Com uma escola filtrada, o gráfico por escola teria uma barra só. */}
        {!umaEscola && (
          <GraficoBarras titulo="Chamados por escola" rotuloItem="Escola" dados={dados.porEscola} />
        )}
        <GraficoBarras
          titulo="Chamados por categoria"
          rotuloItem="Categoria"
          dados={dados.porCategoria}
        />
      </div>

      <RankingEquipamentos equipamentos={dados.topEquipamentos} />
    </div>
  );
}

export default function DashboardPage() {
  // Período e escola ficam na URL, como nos outros filtros do app.
  const { filtro, mudarFiltros } = useParametrosLista();
  const periodo = lerPeriodo(filtro('periodo') || null);
  const personalizado = { de: filtro('de'), ate: filtro('ate') };
  const periodoInvalido = Boolean(
    periodo === 'personalizado' &&
    personalizado.de &&
    personalizado.ate &&
    personalizado.de > personalizado.ate,
  );
  const escolaId = filtro('escolaId');

  const consulta = useIndicadores({
    // Período invertido: o campo mostra o erro e as datas ficam de fora até corrigir.
    ...(periodoInvalido ? {} : datasDoPeriodo(periodo, personalizado)),
    escolaId: escolaId || undefined,
  });

  return (
    <section>
      <CabecalhoPagina
        titulo="Dashboard"
        descricao="Indicadores dos chamados da rede. As contagens usam a data de abertura."
      />

      <FiltrosDashboard
        periodo={periodo}
        de={personalizado.de}
        ate={personalizado.ate}
        escolaId={escolaId}
        periodoInvalido={periodoInvalido}
        aoMudar={mudarFiltros}
      />

      {consulta.isPending ? (
        <EstadoCarregando />
      ) : consulta.isError ? (
        <EstadoErro
          mensagem={mensagemDoErro(consulta.error, 'Não foi possível carregar os indicadores.')}
          aoTentarNovamente={() => void consulta.refetch()}
        />
      ) : (
        // Enquanto um novo filtro carrega, os números antigos ficam esmaecidos.
        <div
          aria-busy={consulta.isPlaceholderData}
          className={`transition-opacity ${consulta.isPlaceholderData ? 'opacity-60' : ''}`}
        >
          <Indicadores dados={consulta.data} umaEscola={Boolean(escolaId)} />
        </div>
      )}
    </section>
  );
}
