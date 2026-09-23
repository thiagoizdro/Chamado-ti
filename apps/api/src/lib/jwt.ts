import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { Perfil } from '../generated/prisma/enums.js';
import { env } from './env.js';

export const DURACAO_TOKEN_MS = 8 * 60 * 60 * 1000; // 8 horas

export type PayloadToken = {
  sub: number;
  perfil: Perfil;
  escolaId: number | null;
};

// O "sub" do JWT é sempre texto; convertemos de volta para o id numérico.
const payloadSchema = z.object({
  sub: z.coerce.number().int().positive(),
  perfil: z.enum(Perfil),
  escolaId: z.number().int().positive().nullable(),
});

export function gerarToken({ sub, perfil, escolaId }: PayloadToken): string {
  return jwt.sign({ perfil, escolaId }, env.JWT_SECRET, {
    subject: String(sub),
    expiresIn: DURACAO_TOKEN_MS / 1000,
    algorithm: 'HS256',
  });
}

// Devolve o payload se o token for válido (assinatura, expiração e formato),
// ou null caso contrário.
export function verificarToken(token: string): PayloadToken | null {
  try {
    const decodificado = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    const resultado = payloadSchema.safeParse(decodificado);
    return resultado.success ? resultado.data : null;
  } catch {
    return null;
  }
}
