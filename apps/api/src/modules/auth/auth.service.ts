import bcrypt from 'bcrypt';

import type { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../lib/AppError.js';
import { gerarToken } from '../../lib/jwt.js';
import { prisma } from '../../lib/prisma.js';
import type { LoginDados } from './auth.schemas.js';

// Mesma mensagem para e-mail inexistente, senha errada e usuário inativo:
// não revela quais e-mails estão cadastrados.
const CREDENCIAIS_INVALIDAS = 'E-mail ou senha inválidos.';

// Quando o e-mail não existe, comparamos a senha com este hash para a
// resposta demorar o mesmo tempo (evita descobrir e-mails pelo tempo).
const HASH_FICTICIO = bcrypt.hashSync('senha-ficticia-so-para-comparacao', 10);

// Campos do usuário que podem sair da API (nunca o senhaHash).
const selecaoUsuarioPublico = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  escolaId: true,
  escola: { select: { id: true, nome: true } },
} satisfies Prisma.UsuarioSelect;

export async function login({ email, senha }: LoginDados) {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: { ...selecaoUsuarioPublico, senhaHash: true, ativo: true },
  });

  const senhaConfere = await bcrypt.compare(senha, usuario?.senhaHash ?? HASH_FICTICIO);
  if (!usuario || !senhaConfere || !usuario.ativo) {
    throw new AppError(401, CREDENCIAIS_INVALIDAS);
  }

  const { senhaHash: _senhaHash, ativo: _ativo, ...usuarioPublico } = usuario;
  const token = gerarToken({
    sub: usuario.id,
    perfil: usuario.perfil,
    escolaId: usuario.escolaId,
  });

  return { token, usuario: usuarioPublico };
}

export async function buscarUsuarioLogado(id: number) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: selecaoUsuarioPublico,
  });
  if (!usuario) {
    throw new AppError(401, 'Você precisa estar logado.');
  }
  return usuario;
}
