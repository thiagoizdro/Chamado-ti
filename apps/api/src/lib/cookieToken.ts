import type { CookieOptions } from 'express';

import { env } from './env.js';
import { DURACAO_TOKEN_MS } from './jwt.js';

export const NOME_COOKIE_TOKEN = 'token';

// Front e API ficam na mesma origem (proxy do Vite / rewrite da Vercel),
// então o cookie é first-party e SameSite=Lax basta. Ver CLAUDE.md, seção 7.
export const opcoesCookieToken: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
};

export const opcoesCookieTokenComValidade: CookieOptions = {
  ...opcoesCookieToken,
  maxAge: DURACAO_TOKEN_MS,
};
