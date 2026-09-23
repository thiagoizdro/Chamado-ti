import type { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../lib/AppError.js';
import { type Paginacao, respostaPaginada, skipTake } from '../../lib/paginacao.js';
import { prisma } from '../../lib/prisma.js';
import { traduzirUnicidade } from '../../lib/prismaErros.js';
import { whereAtivo } from '../../lib/schemas.js';
import type { UsuarioAutenticado } from '../../types/express.js';
import { garantirEscolaAtiva } from '../escolas/escolas.service.js';
import type { DadosEquipamento, FiltrosEquipamentos } from './equipamentos.schemas.js';

const patrimonioDuplicado = () =>
  new AppError(409, 'Já existe um equipamento com este patrimônio.', 'patrimonio');

const incluirEscola = {
  escola: { select: { id: true, nome: true } },
} satisfies Prisma.EquipamentoInclude;

// Solicitante só enxerga os equipamentos ativos da própria escola (é o que
// aparece no select de abertura de chamado), independentemente dos filtros.
function filtroPorPerfil(
  { ativo, escolaId }: FiltrosEquipamentos,
  usuario: UsuarioAutenticado,
): Prisma.EquipamentoWhereInput {
  if (usuario.perfil === 'SOLICITANTE') {
    return { escolaId: usuario.escolaId ?? -1, ativo: true };
  }
  return { ...whereAtivo(ativo), ...(escolaId && { escolaId }) };
}

export async function listar(filtros: FiltrosEquipamentos, usuario: UsuarioAutenticado) {
  const { q, pagina, porPagina } = filtros;
  const paginacao = { pagina, porPagina };
  const where: Prisma.EquipamentoWhereInput = {
    ...filtroPorPerfil(filtros, usuario),
    ...(q && {
      OR: [
        { patrimonio: { contains: q, mode: 'insensitive' } },
        { tipo: { contains: q, mode: 'insensitive' } },
        { marca: { contains: q, mode: 'insensitive' } },
        { modelo: { contains: q, mode: 'insensitive' } },
      ],
    }),
  };

  const [dados, total] = await prisma.$transaction([
    prisma.equipamento.findMany({
      where,
      include: incluirEscola,
      orderBy: { patrimonio: 'asc' },
      ...skipTake(paginacao),
    }),
    prisma.equipamento.count({ where }),
  ]);

  return respostaPaginada(dados, total, paginacao);
}

export async function buscarPorId(id: number) {
  const equipamento = await prisma.equipamento.findUnique({
    where: { id },
    include: { ...incluirEscola, _count: { select: { chamados: true } } },
  });
  if (!equipamento) {
    throw new AppError(404, 'Equipamento não encontrado.');
  }
  return equipamento;
}

export async function criar(dados: DadosEquipamento) {
  await garantirEscolaAtiva(dados.escolaId);
  return traduzirUnicidade(
    () => prisma.equipamento.create({ data: dados, include: incluirEscola }),
    patrimonioDuplicado(),
  );
}

export async function atualizar(id: number, dados: DadosEquipamento) {
  const atual = await buscarPorId(id);

  if (dados.escolaId !== atual.escolaId) {
    // Os chamados antigos continuam da escola antiga; mover o equipamento
    // deixaria o histórico incoerente.
    if (atual._count.chamados > 0) {
      throw new AppError(
        422,
        'Este equipamento já tem chamados e não pode mudar de escola.',
        'escolaId',
      );
    }
    await garantirEscolaAtiva(dados.escolaId);
  }

  return traduzirUnicidade(
    () => prisma.equipamento.update({ where: { id }, data: dados, include: incluirEscola }),
    patrimonioDuplicado(),
  );
}

export async function desativar(id: number) {
  await buscarPorId(id);
  await prisma.equipamento.update({ where: { id }, data: { ativo: false } });
}

// Histórico de defeitos da máquina: chamados do mais recente para o mais antigo.
export async function listarChamados(id: number, paginacao: Paginacao) {
  await buscarPorId(id);
  const where: Prisma.ChamadoWhereInput = { equipamentoId: id };

  const [dados, total] = await prisma.$transaction([
    prisma.chamado.findMany({
      where,
      select: {
        id: true,
        titulo: true,
        status: true,
        prioridade: true,
        solucao: true,
        abertoEm: true,
        resolvidoEm: true,
        categoria: { select: { id: true, nome: true } },
        tecnico: { select: { id: true, nome: true } },
      },
      orderBy: { abertoEm: 'desc' },
      ...skipTake(paginacao),
    }),
    prisma.chamado.count({ where }),
  ]);

  return respostaPaginada(dados, total, paginacao);
}
