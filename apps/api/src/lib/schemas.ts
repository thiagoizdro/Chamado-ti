import { z } from 'zod';

// Schemas reaproveitados por vários módulos.

export const idParamSchema = z.object({
  id: z.coerce.number({ error: 'Id inválido.' }).int().positive('Id inválido.'),
});

export type IdParam = z.infer<typeof idParamSchema>;

// Busca livre: texto vazio vira "sem busca".
export const buscaSchema = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((texto) => texto || undefined);

// Filtro de soft delete das listas de cadastro.
export const filtroAtivoSchema = z.enum(['ativos', 'inativos', 'todos']).default('ativos');

export type FiltroAtivo = z.infer<typeof filtroAtivoSchema>;

export function whereAtivo(filtro: FiltroAtivo) {
  return filtro === 'todos' ? {} : { ativo: filtro === 'ativos' };
}

// Texto opcional de formulário: string vazia vira null (limpa o campo no banco).
export const textoOpcionalSchema = z
  .string()
  .trim()
  .max(255)
  .nullish()
  .transform((texto) => texto || null);

// E-mail sempre normalizado (sem espaços, minúsculo), no login e no cadastro.
export const emailSchema = z
  .string({ error: 'Informe o e-mail.' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Informe um e-mail válido.' }));
