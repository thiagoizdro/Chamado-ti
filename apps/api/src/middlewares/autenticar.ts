import type { Request, RequestHandler } from 'express';

import { AppError } from '../lib/AppError.js';
import { NOME_COOKIE_TOKEN } from '../lib/cookieToken.js';
import { verificarToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import type { UsuarioAutenticado } from '../types/express.js';

const SESSAO_INVALIDA = 'Sessão inválida ou expirada. Faça login novamente.';

// Lê o JWT do cookie e confirma no banco que o usuário ainda existe e está
// ativo. Assim, desativar um usuário corta o acesso na hora, sem esperar o
// token expirar. Perfil e escola também vêm do banco (sempre atualizados).
export const autenticar: RequestHandler = async (req, _res, next) => {
  const token: unknown = req.cookies?.[NOME_COOKIE_TOKEN];
  if (typeof token !== 'string') {
    throw new AppError(401, 'Você precisa estar logado.');
  }

  const payload = verificarToken(token);
  if (!payload) {
    throw new AppError(401, SESSAO_INVALIDA);
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.sub },
    select: { id: true, perfil: true, escolaId: true, ativo: true },
  });
  if (!usuario || !usuario.ativo) {
    throw new AppError(401, SESSAO_INVALIDA);
  }

  req.usuario = { id: usuario.id, perfil: usuario.perfil, escolaId: usuario.escolaId };
  next();
};

// Para controllers atrás do autenticar: devolve o usuário já tipado.
export function usuarioLogado(req: Request): UsuarioAutenticado {
  if (!req.usuario) {
    throw new AppError(401, 'Você precisa estar logado.');
  }
  return req.usuario;
}
