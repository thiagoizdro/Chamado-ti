import type { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../lib/AppError.js';
import { respostaPaginada, skipTake } from '../../lib/paginacao.js';
import { prisma } from '../../lib/prisma.js';
import { traduzirUnicidade } from '../../lib/prismaErros.js';
import { whereAtivo } from '../../lib/schemas.js';
import { gerarHashSenha } from '../../lib/senha.js';
import type {
  DadosAtualizarUsuario,
  DadosCriarUsuario,
  FiltrosUsuarios,
} from './usuarios.schemas.js';

const emailDuplicado = () => new AppError(409, 'Já existe um usuário com este e-mail.', 'email');

// Campos que podem sair da API: o senhaHash nunca é selecionado.
const selecaoUsuario = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  escolaId: true,
  escola: { select: { id: true, nome: true } },
  ativo: true,
  criadoEm: true,
} satisfies Prisma.UsuarioSelect;

export async function listar({ q, ativo, perfil, escolaId, ...paginacao }: FiltrosUsuarios) {
  const where: Prisma.UsuarioWhereInput = {
    ...whereAtivo(ativo),
    ...(perfil && { perfil }),
    ...(escolaId && { escolaId }),
    ...(q && {
      OR: [
        { nome: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    }),
  };

  const [dados, total] = await prisma.$transaction([
    prisma.usuario.findMany({
      where,
      select: selecaoUsuario,
      orderBy: { nome: 'asc' },
      ...skipTake(paginacao),
    }),
    prisma.usuario.count({ where }),
  ]);

  return respostaPaginada(dados, total, paginacao);
}

export async function buscarPorId(id: number) {
  const usuario = await prisma.usuario.findUnique({ where: { id }, select: selecaoUsuario });
  if (!usuario) {
    throw new AppError(404, 'Usuário não encontrado.');
  }
  return usuario;
}

async function garantirEscolaAtiva(escolaId: number) {
  const escola = await prisma.escola.findUnique({ where: { id: escolaId } });
  if (!escola?.ativo) {
    throw new AppError(422, 'Escola não encontrada ou inativa.', 'escolaId');
  }
}

export async function criar({ senha, ...dados }: DadosCriarUsuario) {
  if (dados.escolaId !== null) await garantirEscolaAtiva(dados.escolaId);

  const senhaHash = await gerarHashSenha(senha);
  return traduzirUnicidade(
    () => prisma.usuario.create({ data: { ...dados, senhaHash }, select: selecaoUsuario }),
    emailDuplicado(),
  );
}

export async function atualizar(
  id: number,
  { senha, ...dados }: DadosAtualizarUsuario,
  idAdminLogado: number,
) {
  const atual = await buscarPorId(id);

  // Impede o admin de se trancar para fora do sistema.
  if (id === idAdminLogado) {
    if (dados.ativo === false) {
      throw new AppError(422, 'Você não pode desativar o próprio usuário.');
    }
    if (dados.perfil !== atual.perfil) {
      throw new AppError(422, 'Você não pode alterar o próprio perfil.', 'perfil');
    }
  }

  // Só valida a escola se ela mudou: editar o nome de um solicitante de uma
  // escola que foi desativada depois não deve ser bloqueado.
  if (dados.escolaId !== null && dados.escolaId !== atual.escolaId) {
    await garantirEscolaAtiva(dados.escolaId);
  }

  const senhaHash = senha ? await gerarHashSenha(senha) : undefined;
  return traduzirUnicidade(
    () =>
      prisma.usuario.update({
        where: { id },
        data: { ...dados, senhaHash },
        select: selecaoUsuario,
      }),
    emailDuplicado(),
  );
}

export async function desativar(id: number, idAdminLogado: number) {
  await buscarPorId(id);
  if (id === idAdminLogado) {
    throw new AppError(422, 'Você não pode desativar o próprio usuário.');
  }
  await prisma.usuario.update({ where: { id }, data: { ativo: false } });
}
