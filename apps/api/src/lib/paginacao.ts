import { z } from 'zod';

export const paginacaoSchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(20),
});

export type Paginacao = z.infer<typeof paginacaoSchema>;

export type RespostaPaginada<T> = {
  dados: T[];
  total: number;
  pagina: number;
  porPagina: number;
};

// Converte página/porPagina para o skip/take do Prisma.
export function skipTake({ pagina, porPagina }: Paginacao) {
  return { skip: (pagina - 1) * porPagina, take: porPagina };
}

export function respostaPaginada<T>(
  dados: T[],
  total: number,
  { pagina, porPagina }: Paginacao,
): RespostaPaginada<T> {
  return { dados, total, pagina, porPagina };
}
