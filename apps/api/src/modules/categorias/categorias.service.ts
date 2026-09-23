import type { Prisma } from '../../generated/prisma/client.js';
import type { Perfil } from '../../generated/prisma/enums.js';
import { AppError } from '../../lib/AppError.js';
import { respostaPaginada, skipTake } from '../../lib/paginacao.js';
import { prisma } from '../../lib/prisma.js';
import { traduzirUnicidade } from '../../lib/prismaErros.js';
import { whereAtivo } from '../../lib/schemas.js';
import type { DadosCategoria, FiltrosCategorias } from './categorias.schemas.js';

const nomeDuplicado = () => new AppError(409, 'Já existe uma categoria com este nome.', 'nome');

// Quem não é admin só enxerga categorias ativas (é o que aparece no select
// de abertura de chamado).
export async function listar({ q, ativo, ...paginacao }: FiltrosCategorias, perfil: Perfil) {
  const where: Prisma.CategoriaWhereInput = {
    ...whereAtivo(perfil === 'ADMIN' ? ativo : 'ativos'),
    ...(q && { nome: { contains: q, mode: 'insensitive' } }),
  };

  const [dados, total] = await prisma.$transaction([
    prisma.categoria.findMany({ where, orderBy: { nome: 'asc' }, ...skipTake(paginacao) }),
    prisma.categoria.count({ where }),
  ]);

  return respostaPaginada(dados, total, paginacao);
}

// O @unique do banco diferencia maiúsculas; aqui "impressora" também conflita
// com "Impressora".
async function garantirNomeLivre(nome: string, idAtual?: number) {
  const existente = await prisma.categoria.findFirst({
    where: {
      nome: { equals: nome, mode: 'insensitive' },
      ...(idAtual && { NOT: { id: idAtual } }),
    },
  });
  if (existente) throw nomeDuplicado();
}

async function buscarPorId(id: number) {
  const categoria = await prisma.categoria.findUnique({ where: { id } });
  if (!categoria) {
    throw new AppError(404, 'Categoria não encontrada.');
  }
  return categoria;
}

export async function criar(dados: DadosCategoria) {
  await garantirNomeLivre(dados.nome);
  return traduzirUnicidade(() => prisma.categoria.create({ data: dados }), nomeDuplicado());
}

export async function atualizar(id: number, dados: DadosCategoria) {
  await buscarPorId(id);
  await garantirNomeLivre(dados.nome, id);
  return traduzirUnicidade(
    () => prisma.categoria.update({ where: { id }, data: dados }),
    nomeDuplicado(),
  );
}

export async function desativar(id: number) {
  await buscarPorId(id);
  await prisma.categoria.update({ where: { id }, data: { ativo: false } });
}
