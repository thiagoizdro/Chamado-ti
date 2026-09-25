import type { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../lib/AppError.js';
import { respostaPaginada, skipTake } from '../../lib/paginacao.js';
import { intervaloDoPeriodo } from '../../lib/periodo.js';
import { prisma } from '../../lib/prisma.js';
import type { UsuarioAutenticado } from '../../types/express.js';
import { garantirEscolaAtiva } from '../escolas/escolas.service.js';
import type {
  DadosComentario,
  DadosCriarChamado,
  DadosMudarStatus,
  FiltrosChamados,
} from './chamados.schemas.js';
import { podeTransitar, ROTULO_STATUS } from './status.js';

const selecionarResumo = {
  id: true,
  titulo: true,
  status: true,
  prioridade: true,
  abertoEm: true,
  resolvidoEm: true,
  escola: { select: { id: true, nome: true } },
  categoria: { select: { id: true, nome: true } },
  equipamento: { select: { id: true, patrimonio: true, tipo: true } },
  solicitante: { select: { id: true, nome: true } },
  tecnico: { select: { id: true, nome: true } },
} satisfies Prisma.ChamadoSelect;

const selecionarDetalhe = {
  ...selecionarResumo,
  descricao: true,
  solucao: true,
  atualizadoEm: true,
  historico: {
    select: {
      id: true,
      acao: true,
      statusAnterior: true,
      statusNovo: true,
      descricao: true,
      criadoEm: true,
      usuario: { select: { id: true, nome: true } },
    },
    // Linha do tempo: do mais antigo para o mais novo. O id desempata
    // registros gravados no mesmo instante (ex.: ATRIBUIDO + STATUS_ALTERADO).
    orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.ChamadoSelect;

// Solicitante só enxerga chamados da própria escola. O filtro fica no where
// da consulta (e não só na checagem de perfil) para evitar IDOR: um id de
// outra escola simplesmente "não existe" e vira 404.
function escopoDoUsuario(usuario: UsuarioAutenticado): Prisma.ChamadoWhereInput {
  return usuario.perfil === 'SOLICITANTE' ? { escolaId: usuario.escolaId ?? -1 } : {};
}

const ORDENACAO: Record<FiltrosChamados['ordem'], Prisma.ChamadoOrderByWithRelationInput[]> = {
  recentes: [{ abertoEm: 'desc' }, { id: 'desc' }],
  // O enum Prioridade é ordenado de BAIXA a CRITICA no Postgres.
  prioridade: [{ prioridade: 'desc' }, { abertoEm: 'asc' }],
};

// Cada filtro informado vira uma condição; todas precisam valer (AND).
function whereDosFiltros(filtros: FiltrosChamados): Prisma.ChamadoWhereInput {
  const { status, prioridade, escolaId, categoriaId, tecnicoId, q } = filtros;
  const abertoEm = intervaloDoPeriodo(filtros);
  return {
    ...(status?.length && { status: { in: status } }),
    ...(prioridade?.length && { prioridade: { in: prioridade } }),
    ...(escolaId && { escolaId }),
    ...(categoriaId && { categoriaId }),
    ...(tecnicoId && { tecnicoId }),
    ...(abertoEm && { abertoEm }),
    ...(q && {
      OR: [
        { titulo: { contains: q, mode: 'insensitive' } },
        { descricao: { contains: q, mode: 'insensitive' } },
        { equipamento: { patrimonio: { contains: q, mode: 'insensitive' } } },
      ],
    }),
  };
}

export async function listar(filtros: FiltrosChamados, usuario: UsuarioAutenticado) {
  const { ordem, pagina, porPagina } = filtros;
  const paginacao = { pagina, porPagina };
  // O escopo vem por último: para o solicitante, sobrescreve qualquer escolaId do filtro.
  const where: Prisma.ChamadoWhereInput = {
    ...whereDosFiltros(filtros),
    ...escopoDoUsuario(usuario),
  };

  // Promise.all em vez de $transaction([...]): com várias relações no select,
  // o Prisma dispara consultas em paralelo numa única conexão da transação,
  // o que o driver pg já marca como obsoleto. Um total levemente defasado da
  // página, sob escrita concorrente, não é problema numa listagem.
  const [dados, total] = await Promise.all([
    prisma.chamado.findMany({
      where,
      select: selecionarResumo,
      orderBy: ORDENACAO[ordem],
      ...skipTake(paginacao),
    }),
    prisma.chamado.count({ where }),
  ]);

  return respostaPaginada(dados, total, paginacao);
}

export async function buscarPorId(id: number, usuario: UsuarioAutenticado) {
  const chamado = await prisma.chamado.findFirst({
    where: { id, ...escopoDoUsuario(usuario) },
    select: selecionarDetalhe,
  });
  if (!chamado) {
    throw new AppError(404, 'Chamado não encontrado.');
  }
  return chamado;
}

// Para solicitante a escola é sempre a dele, mesmo que o body traga outra.
function escolaDoChamado(dados: DadosCriarChamado, usuario: UsuarioAutenticado): number {
  const escolaId = usuario.perfil === 'SOLICITANTE' ? usuario.escolaId : dados.escolaId;
  if (!escolaId) {
    throw new AppError(422, 'Selecione a escola.', 'escolaId');
  }
  return escolaId;
}

async function garantirCategoriaAtiva(categoriaId: number) {
  const categoria = await prisma.categoria.findUnique({ where: { id: categoriaId } });
  if (!categoria?.ativo) {
    throw new AppError(422, 'Categoria não encontrada ou inativa.', 'categoriaId');
  }
}

// O equipamento precisa ser da mesma escola do chamado.
async function garantirEquipamentoDaEscola(equipamentoId: number, escolaId: number) {
  const equipamento = await prisma.equipamento.findUnique({ where: { id: equipamentoId } });
  if (!equipamento?.ativo || equipamento.escolaId !== escolaId) {
    throw new AppError(
      422,
      'Equipamento não encontrado, inativo ou de outra escola.',
      'equipamentoId',
    );
  }
}

export async function criar(dados: DadosCriarChamado, usuario: UsuarioAutenticado) {
  const escolaId = escolaDoChamado(dados, usuario);
  await garantirEscolaAtiva(escolaId);
  await garantirCategoriaAtiva(dados.categoriaId);
  if (dados.equipamentoId) {
    await garantirEquipamentoDaEscola(dados.equipamentoId, escolaId);
  }

  const { titulo, descricao, prioridade, categoriaId, equipamentoId } = dados;
  const { id } = await prisma.$transaction(async (tx) => {
    const chamado = await tx.chamado.create({
      data: {
        titulo,
        descricao,
        prioridade,
        categoriaId,
        equipamentoId,
        escolaId,
        solicitanteId: usuario.id,
      },
    });
    await tx.historicoChamado.create({
      data: { chamadoId: chamado.id, usuarioId: usuario.id, acao: 'CRIADO', statusNovo: 'ABERTO' },
    });
    return chamado;
  });

  return buscarPorId(id, usuario);
}

// À prova de concorrência: o where do updateMany só casa se o chamado ainda
// estiver ABERTO e sem técnico. Se dois técnicos clicarem juntos, só um
// atualiza a linha; o outro recebe count 0 e um 409.
export async function assumir(id: number, usuario: UsuarioAutenticado) {
  await buscarPorId(id, usuario);

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.chamado.updateMany({
      where: { id, status: 'ABERTO', tecnicoId: null },
      data: { tecnicoId: usuario.id, status: 'EM_ATENDIMENTO' },
    });
    if (count === 0) {
      throw new AppError(409, 'Este chamado já foi assumido por outro técnico.');
    }
    await tx.historicoChamado.createMany({
      data: [
        { chamadoId: id, usuarioId: usuario.id, acao: 'ATRIBUIDO' },
        {
          chamadoId: id,
          usuarioId: usuario.id,
          acao: 'STATUS_ALTERADO',
          statusAnterior: 'ABERTO',
          statusNovo: 'EM_ATENDIMENTO',
        },
      ],
    });
  });

  return buscarPorId(id, usuario);
}

export async function mudarStatus(
  id: number,
  { status: novo, solucao, observacao }: DadosMudarStatus,
  usuario: UsuarioAutenticado,
) {
  const atual = await buscarPorId(id, usuario);

  // Sair de ABERTO é sempre pelo "assumir", que também define o técnico.
  if (!atual.tecnico) {
    throw new AppError(422, 'Assuma o chamado antes de mudar o status.');
  }
  if (!podeTransitar(atual.status, novo)) {
    throw new AppError(
      422,
      `Não é possível mudar o status de "${ROTULO_STATUS[atual.status]}" para "${ROTULO_STATUS[novo]}".`,
      'status',
    );
  }
  const resolvendo = novo === 'RESOLVIDO';
  if (resolvendo && !solucao) {
    throw new AppError(422, 'Descreva a solução para resolver o chamado.', 'solucao');
  }

  await prisma.$transaction(async (tx) => {
    // O status atual no where evita sobrescrever uma mudança feita por outra
    // pessoa entre a leitura acima e esta escrita.
    const { count } = await tx.chamado.updateMany({
      where: { id, status: atual.status },
      data: { status: novo, ...(resolvendo && { solucao, resolvidoEm: new Date() }) },
    });
    if (count === 0) {
      throw new AppError(409, 'O chamado foi alterado por outra pessoa. Recarregue a página.');
    }

    const base = { chamadoId: id, usuarioId: usuario.id };
    await tx.historicoChamado.createMany({
      data: [
        {
          ...base,
          acao: 'STATUS_ALTERADO',
          statusAnterior: atual.status,
          statusNovo: novo,
          descricao: observacao ?? null,
        },
        ...(resolvendo
          ? [{ ...base, acao: 'SOLUCAO_REGISTRADA' as const, descricao: solucao }]
          : []),
      ],
    });
  });

  return buscarPorId(id, usuario);
}

export async function comentar(
  id: number,
  { texto }: DadosComentario,
  usuario: UsuarioAutenticado,
) {
  const chamado = await buscarPorId(id, usuario);
  if (chamado.status === 'RESOLVIDO') {
    throw new AppError(422, 'Chamados resolvidos não recebem novos comentários.');
  }

  // O comentário também conta como atividade no chamado (atualizadoEm).
  return prisma.$transaction(async (tx) => {
    await tx.chamado.update({ where: { id }, data: { atualizadoEm: new Date() } });
    return tx.historicoChamado.create({
      data: { chamadoId: id, usuarioId: usuario.id, acao: 'COMENTARIO', descricao: texto },
      select: selecionarDetalhe.historico.select,
    });
  });
}
