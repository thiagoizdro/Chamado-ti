import { z } from 'zod';

import { Perfil } from '../../generated/prisma/enums.js';
import { paginacaoSchema } from '../../lib/paginacao.js';
import { buscaSchema, emailSchema, filtroAtivoSchema } from '../../lib/schemas.js';

// bcrypt só considera os primeiros 72 bytes da senha.
const senhaSchema = z
  .string({ error: 'Informe a senha.' })
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(72, 'A senha pode ter no máximo 72 caracteres.');

const camposUsuario = {
  nome: z
    .string({ error: 'Informe o nome.' })
    .trim()
    .min(3, 'O nome precisa ter pelo menos 3 caracteres.')
    .max(120, 'O nome pode ter no máximo 120 caracteres.'),
  email: emailSchema,
  perfil: z.enum(Perfil, { error: 'Selecione um perfil válido.' }),
  escolaId: z
    .number({ error: 'Escola inválida.' })
    .int()
    .positive()
    .nullish()
    .transform((id) => id ?? null),
  ativo: z.boolean().optional(),
};

type CamposComEscola = { perfil: Perfil; escolaId: number | null };

// Regra da seção 6: solicitante exige escola; técnico e admin não têm escola.
function validarEscolaDoPerfil({ perfil, escolaId }: CamposComEscola, contexto: z.RefinementCtx) {
  if (perfil === 'SOLICITANTE' && escolaId === null) {
    contexto.addIssue({
      code: 'custom',
      path: ['escolaId'],
      message: 'Selecione a escola do solicitante.',
    });
  }
  if (perfil !== 'SOLICITANTE' && escolaId !== null) {
    contexto.addIssue({
      code: 'custom',
      path: ['escolaId'],
      message: 'Técnicos e administradores não são vinculados a uma escola.',
    });
  }
}

export const criarUsuarioSchema = z
  .object({ ...camposUsuario, senha: senhaSchema })
  .superRefine(validarEscolaDoPerfil);

// Na edição a senha é opcional: vazia ou ausente = manter a atual.
export const atualizarUsuarioSchema = z
  .object({
    ...camposUsuario,
    senha: z
      .string()
      .optional()
      .transform((senha) => senha || undefined)
      .pipe(senhaSchema.optional()),
  })
  .superRefine(validarEscolaDoPerfil);

export const listarUsuariosSchema = paginacaoSchema.extend({
  q: buscaSchema,
  ativo: filtroAtivoSchema,
  perfil: z.enum(Perfil).optional(),
  escolaId: z.coerce.number().int().positive().optional(),
});

export type DadosCriarUsuario = z.infer<typeof criarUsuarioSchema>;
export type DadosAtualizarUsuario = z.infer<typeof atualizarUsuarioSchema>;
export type FiltrosUsuarios = z.infer<typeof listarUsuariosSchema>;
