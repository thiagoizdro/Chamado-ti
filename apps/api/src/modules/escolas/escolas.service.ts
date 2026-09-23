import type { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../lib/AppError.js';
import { respostaPaginada, skipTake } from '../../lib/paginacao.js';
import { prisma } from '../../lib/prisma.js';
import { traduzirUnicidade } from '../../lib/prismaErros.js';
import { whereAtivo } from '../../lib/schemas.js';
import type { DadosEscola, FiltrosEscolas } from './escolas.schemas.js';

const inepDuplicado = () =>
  new AppError(409, 'Já existe uma escola com este código INEP.', 'codigoInep');

export async function listar({ q, ativo, ...paginacao }: FiltrosEscolas) {
  const where: Prisma.EscolaWhereInput = {
    ...whereAtivo(ativo),
    ...(q && {
      OR: [{ nome: { contains: q, mode: 'insensitive' } }, { codigoInep: { contains: q } }],
    }),
  };

  const [dados, total] = await prisma.$transaction([
    prisma.escola.findMany({ where, orderBy: { nome: 'asc' }, ...skipTake(paginacao) }),
    prisma.escola.count({ where }),
  ]);

  return respostaPaginada(dados, total, paginacao);
}

export async function buscarPorId(id: number) {
  const escola = await prisma.escola.findUnique({ where: { id } });
  if (!escola) {
    throw new AppError(404, 'Escola não encontrada.');
  }
  return escola;
}

// Usada por outros módulos antes de vincular algo (usuário, equipamento) a uma escola.
export async function garantirEscolaAtiva(escolaId: number) {
  const escola = await prisma.escola.findUnique({ where: { id: escolaId } });
  if (!escola?.ativo) {
    throw new AppError(422, 'Escola não encontrada ou inativa.', 'escolaId');
  }
}

export function criar(dados: DadosEscola) {
  return traduzirUnicidade(() => prisma.escola.create({ data: dados }), inepDuplicado());
}

export async function atualizar(id: number, dados: DadosEscola) {
  await buscarPorId(id);
  return traduzirUnicidade(
    () => prisma.escola.update({ where: { id }, data: dados }),
    inepDuplicado(),
  );
}

// Soft delete: a escola some das listas e selects, mas o histórico continua.
export async function desativar(id: number) {
  await buscarPorId(id);
  await prisma.escola.update({ where: { id }, data: { ativo: false } });
}
