import { Prisma } from '../../generated/prisma/client.js';
import type { StatusChamado } from '../../generated/prisma/enums.js';
import { intervaloDoPeriodo } from '../../lib/periodo.js';
import { prisma } from '../../lib/prisma.js';
import type { FiltrosDashboard } from './dashboard.schemas.js';

const TOP_EQUIPAMENTOS = 10;

// Contagens consideram os chamados ABERTOS no período. O tempo médio de
// resolução considera os chamados RESOLVIDOS no período (outra pergunta:
// "quanto demoramos para fechar o que fechamos neste mês?").
function whereDoPeriodo({ de, ate, escolaId }: FiltrosDashboard): Prisma.ChamadoWhereInput {
  const abertoEm = intervaloDoPeriodo({ de, ate });
  return { ...(abertoEm && { abertoEm }), ...(escolaId && { escolaId }) };
}

async function totaisPorStatus(where: Prisma.ChamadoWhereInput) {
  const grupos = await prisma.chamado.groupBy({ by: ['status'], where, _count: { _all: true } });
  // Todos os status aparecem, mesmo com zero (os cards do front são fixos).
  const porStatus: Record<StatusChamado, number> = {
    ABERTO: 0,
    EM_ATENDIMENTO: 0,
    AGUARDANDO_PECA: 0,
    RESOLVIDO: 0,
  };
  for (const grupo of grupos) porStatus[grupo.status] = grupo._count._all;
  return porStatus;
}

type Contagem = { id: number; nome: string; total: number };

// Junta as contagens do groupBy com os nomes. Itens ativos sem chamados entram
// com zero (uma escola sem chamados também é informação); inativos só aparecem
// se tiverem chamados no período.
function comNomes(itens: { id: number; nome: string }[], totais: Map<number, number>): Contagem[] {
  return itens
    .map(({ id, nome }) => ({ id, nome, total: totais.get(id) ?? 0 }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'));
}

async function chamadosPorEscola(where: Prisma.ChamadoWhereInput, escolaId?: number) {
  const grupos = await prisma.chamado.groupBy({ by: ['escolaId'], where, _count: { _all: true } });
  const totais = new Map(grupos.map((grupo) => [grupo.escolaId, grupo._count._all]));
  const escolas = await prisma.escola.findMany({
    where: escolaId
      ? { id: escolaId }
      : { OR: [{ ativo: true }, { id: { in: [...totais.keys()] } }] },
    select: { id: true, nome: true },
  });
  return comNomes(escolas, totais);
}

async function chamadosPorCategoria(where: Prisma.ChamadoWhereInput) {
  const grupos = await prisma.chamado.groupBy({
    by: ['categoriaId'],
    where,
    _count: { _all: true },
  });
  const totais = new Map(grupos.map((grupo) => [grupo.categoriaId, grupo._count._all]));
  const categorias = await prisma.categoria.findMany({
    where: { OR: [{ ativo: true }, { id: { in: [...totais.keys()] } }] },
    select: { id: true, nome: true },
  });
  return comNomes(categorias, totais);
}

async function equipamentosComMaisChamados(where: Prisma.ChamadoWhereInput) {
  const grupos = await prisma.chamado.groupBy({
    by: ['equipamentoId'],
    where: { ...where, equipamentoId: { not: null } },
    _count: { _all: true },
    orderBy: [{ _count: { equipamentoId: 'desc' } }, { equipamentoId: 'asc' }],
    take: TOP_EQUIPAMENTOS,
  });
  const ids = grupos.flatMap((grupo) => (grupo.equipamentoId ? [grupo.equipamentoId] : []));
  const equipamentos = await prisma.equipamento.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      patrimonio: true,
      tipo: true,
      modelo: true,
      escola: { select: { id: true, nome: true } },
    },
  });
  const porId = new Map(equipamentos.map((equipamento) => [equipamento.id, equipamento]));

  // Mantém a ordem do ranking (o findMany não garante ordem).
  return grupos.flatMap((grupo) => {
    const equipamento = grupo.equipamentoId ? porId.get(grupo.equipamentoId) : undefined;
    return equipamento ? [{ ...equipamento, total: grupo._count._all }] : [];
  });
}

// Média de (resolvidoEm - abertoEm) em horas. É uma agregação sobre uma
// diferença de datas, que o Prisma não expressa: por isso SQL puro. O
// $queryRaw com template já parametriza os valores (sem risco de SQL injection).
async function tempoMedioDeResolucao({ de, ate, escolaId }: FiltrosDashboard) {
  const resolvidoEm = intervaloDoPeriodo({ de, ate });
  const condicoes = [
    Prisma.sql`status = 'RESOLVIDO' AND resolvido_em IS NOT NULL`,
    ...(resolvidoEm?.gte ? [Prisma.sql`resolvido_em >= ${resolvidoEm.gte}`] : []),
    ...(resolvidoEm?.lt ? [Prisma.sql`resolvido_em < ${resolvidoEm.lt}`] : []),
    ...(escolaId ? [Prisma.sql`escola_id = ${escolaId}`] : []),
  ];

  const [resultado] = await prisma.$queryRaw<{ horas: number | null; quantidade: bigint }[]>`
    SELECT
      AVG(EXTRACT(EPOCH FROM (resolvido_em - aberto_em)) / 3600)::float8 AS horas,
      COUNT(*) AS quantidade
    FROM chamados
    WHERE ${Prisma.join(condicoes, ' AND ')}
  `;

  return {
    // Uma casa decimal basta para um indicador em horas.
    horas: resultado?.horas == null ? null : Math.round(resultado.horas * 10) / 10,
    chamadosResolvidos: Number(resultado?.quantidade ?? 0),
  };
}

export async function obterIndicadores(filtros: FiltrosDashboard) {
  const where = whereDoPeriodo(filtros);

  const [porStatus, porEscola, porCategoria, topEquipamentos, tempoMedio] = await Promise.all([
    totaisPorStatus(where),
    chamadosPorEscola(where, filtros.escolaId),
    chamadosPorCategoria(where),
    equipamentosComMaisChamados(where),
    tempoMedioDeResolucao(filtros),
  ]);

  const total = Object.values(porStatus).reduce((soma, quantidade) => soma + quantidade, 0);

  return {
    total,
    porStatus,
    porEscola,
    porCategoria,
    topEquipamentos,
    tempoMedioResolucao: tempoMedio,
  };
}
