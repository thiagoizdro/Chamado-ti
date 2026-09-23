import type { ErrorRequestHandler, RequestHandler } from 'express';

import { Prisma } from '../generated/prisma/client.js';
import { AppError } from '../lib/AppError.js';

// Erros conhecidos do Prisma traduzidos para respostas amigáveis.
const ERROS_PRISMA: Record<string, { statusCode: number; mensagem: string }> = {
  P2002: { statusCode: 409, mensagem: 'Já existe um registro com esse valor.' },
  P2025: { statusCode: 404, mensagem: 'Registro não encontrado.' },
};

export const rotaNaoEncontrada: RequestHandler = (_req, res) => {
  res.status(404).json({ mensagem: 'Rota não encontrada.' });
};

export const tratarErro: ErrorRequestHandler = (erro: unknown, _req, res, _next) => {
  if (erro instanceof AppError) {
    const erros = erro.campo ? { [erro.campo]: erro.message } : undefined;
    res.status(erro.statusCode).json({ mensagem: erro.message, erros });
    return;
  }

  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    const conhecido = ERROS_PRISMA[erro.code];
    if (conhecido) {
      res.status(conhecido.statusCode).json({ mensagem: conhecido.mensagem });
      return;
    }
  }

  // JSON malformado no corpo (lançado pelo express.json)
  if (erro instanceof SyntaxError && 'type' in erro && erro.type === 'entity.parse.failed') {
    res.status(400).json({ mensagem: 'JSON inválido no corpo da requisição.' });
    return;
  }

  console.error(erro);
  res.status(500).json({ mensagem: 'Erro interno do servidor.' });
};
