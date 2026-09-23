import { Prisma } from '../generated/prisma/client.js';

// Violação de @unique (ex.: e-mail ou patrimônio repetido). Os services
// capturam esse erro para responder com uma mensagem específica do campo.
export function ehViolacaoDeUnicidade(erro: unknown): boolean {
  return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002';
}
