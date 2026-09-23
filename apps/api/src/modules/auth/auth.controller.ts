import type { Request, Response } from 'express';

import {
  NOME_COOKIE_TOKEN,
  opcoesCookieToken,
  opcoesCookieTokenComValidade,
} from '../../lib/cookieToken.js';
import { usuarioLogado } from '../../middlewares/autenticar.js';
import type { LoginDados } from './auth.schemas.js';
import * as authService from './auth.service.js';

export async function login(req: Request, res: Response) {
  const { token, usuario } = await authService.login(req.body as LoginDados);
  res.cookie(NOME_COOKIE_TOKEN, token, opcoesCookieTokenComValidade);
  res.json({ usuario });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(NOME_COOKIE_TOKEN, opcoesCookieToken);
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const usuario = await authService.buscarUsuarioLogado(usuarioLogado(req).id);
  res.json({ usuario });
}
