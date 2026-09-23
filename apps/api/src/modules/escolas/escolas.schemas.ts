import { z } from 'zod';

import { paginacaoSchema } from '../../lib/paginacao.js';
import { buscaSchema, filtroAtivoSchema, textoOpcionalSchema } from '../../lib/schemas.js';

const codigoInepSchema = z
  .string()
  .trim()
  .nullish()
  .transform((codigo) => codigo || null)
  .pipe(
    z
      .string()
      .regex(/^\d{8}$/, 'O código INEP tem 8 dígitos.')
      .nullable(),
  );

// PUT substitui o cadastro inteiro; "ativo" é opcional e serve para reativar.
export const escolaSchema = z.object({
  nome: z
    .string({ error: 'Informe o nome.' })
    .trim()
    .min(3, 'O nome precisa ter pelo menos 3 caracteres.')
    .max(150, 'O nome pode ter no máximo 150 caracteres.'),
  codigoInep: codigoInepSchema,
  endereco: textoOpcionalSchema,
  ativo: z.boolean().optional(),
});

export const listarEscolasSchema = paginacaoSchema.extend({
  q: buscaSchema,
  ativo: filtroAtivoSchema,
});

export type DadosEscola = z.infer<typeof escolaSchema>;
export type FiltrosEscolas = z.infer<typeof listarEscolasSchema>;
