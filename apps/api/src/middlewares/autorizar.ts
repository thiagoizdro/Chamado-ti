import type { RequestHandler } from 'express';

import type { Perfil } from '../generated/prisma/enums.js';
import { AppError } from '../lib/AppError.js';
import { usuarioLogado } from './autenticar.js';

// Uso: router.get('/rota', autenticar, autorizar('TECNICO', 'ADMIN'), controller)
export function autorizar(...perfis: Perfil[]): RequestHandler {
  return (req, _res, next) => {
    const { perfil } = usuarioLogado(req);
    if (!perfis.includes(perfil)) {
      throw new AppError(403, 'Você não tem permissão para acessar este recurso.');
    }
    next();
  };
}
