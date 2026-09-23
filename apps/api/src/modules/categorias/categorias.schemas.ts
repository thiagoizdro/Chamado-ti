import { z } from 'zod';

import { paginacaoSchema } from '../../lib/paginacao.js';
import { buscaSchema, filtroAtivoSchema } from '../../lib/schemas.js';

export const categoriaSchema = z.object({
  nome: z
    .string({ error: 'Informe o nome.' })
    .trim()
    .min(2, 'O nome precisa ter pelo menos 2 caracteres.')
    .max(60, 'O nome pode ter no máximo 60 caracteres.'),
  ativo: z.boolean().optional(),
});

export const listarCategoriasSchema = paginacaoSchema.extend({
  q: buscaSchema,
  ativo: filtroAtivoSchema,
});

export type DadosCategoria = z.infer<typeof categoriaSchema>;
export type FiltrosCategorias = z.infer<typeof listarCategoriasSchema>;
