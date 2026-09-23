import { z } from 'zod';

import { paginacaoSchema } from '../../lib/paginacao.js';
import { buscaSchema, filtroAtivoSchema, textoOpcionalSchema } from '../../lib/schemas.js';

export const equipamentoSchema = z.object({
  // Maiúsculas: "pat-000123" e "PAT-000123" são o mesmo patrimônio.
  patrimonio: z
    .string({ error: 'Informe o patrimônio.' })
    .trim()
    .toUpperCase()
    .min(3, 'O patrimônio precisa ter pelo menos 3 caracteres.')
    .max(30, 'O patrimônio pode ter no máximo 30 caracteres.'),
  tipo: z
    .string({ error: 'Informe o tipo.' })
    .trim()
    .min(2, 'Informe o tipo.')
    .max(60, 'O tipo pode ter no máximo 60 caracteres.'),
  marca: textoOpcionalSchema,
  modelo: textoOpcionalSchema,
  localizacao: textoOpcionalSchema,
  escolaId: z.number({ error: 'Selecione a escola.' }).int().positive('Selecione a escola.'),
  ativo: z.boolean().optional(),
});

export const listarEquipamentosSchema = paginacaoSchema.extend({
  q: buscaSchema,
  ativo: filtroAtivoSchema,
  escolaId: z.coerce.number().int().positive().optional(),
});

export type DadosEquipamento = z.infer<typeof equipamentoSchema>;
export type FiltrosEquipamentos = z.infer<typeof listarEquipamentosSchema>;
