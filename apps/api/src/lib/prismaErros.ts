import { Prisma } from '../generated/prisma/client.js';
import type { AppError } from './AppError.js';

// Violação de @unique (ex.: e-mail ou patrimônio repetido).
export function ehViolacaoDeUnicidade(erro: unknown): boolean {
  return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002';
}

// Executa a operação e, se ela violar um @unique, lança o AppError informado
// (com a mensagem e o campo específicos do módulo) no lugar do erro genérico.
export async function traduzirUnicidade<T>(
  operacao: () => Promise<T>,
  conflito: AppError,
): Promise<T> {
  try {
    return await operacao();
  } catch (erro) {
    if (ehViolacaoDeUnicidade(erro)) throw conflito;
    throw erro;
  }
}
