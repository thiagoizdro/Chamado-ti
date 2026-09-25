import { z } from 'zod';

import { Prioridade, StatusChamado } from '../../generated/prisma/enums.js';
import { paginacaoSchema } from '../../lib/paginacao.js';

const idOpcionalSchema = (mensagem: string) =>
  z
    .number({ error: mensagem })
    .int()
    .positive(mensagem)
    .nullish()
    .transform((id) => id ?? null);

const textoLongoSchema = (campo: string, minimo: number) =>
  z
    .string({ error: `Informe ${campo}.` })
    .trim()
    .min(minimo, `Informe ${campo} com pelo menos ${minimo} caracteres.`)
    .max(2000, 'O texto pode ter no máximo 2000 caracteres.');

export const criarChamadoSchema = z.object({
  titulo: z
    .string({ error: 'Informe o título.' })
    .trim()
    .min(5, 'O título precisa ter pelo menos 5 caracteres.')
    .max(120, 'O título pode ter no máximo 120 caracteres.'),
  descricao: textoLongoSchema('a descrição', 10),
  prioridade: z.enum(Prioridade, { error: 'Selecione uma prioridade válida.' }).default('MEDIA'),
  categoriaId: z
    .number({ error: 'Selecione a categoria.' })
    .int()
    .positive('Selecione a categoria.'),
  equipamentoId: idOpcionalSchema('Equipamento inválido.'),
  // Obrigatória para admin; para solicitante é ignorada (vale a escola dele).
  escolaId: idOpcionalSchema('Escola inválida.'),
});

export const mudarStatusSchema = z.object({
  status: z.enum(StatusChamado, { error: 'Selecione um status válido.' }),
  // Obrigatória ao resolver (checado no service, que conhece o status).
  solucao: z
    .string()
    .trim()
    .max(2000, 'A solução pode ter no máximo 2000 caracteres.')
    .optional()
    .transform((texto) => texto || undefined),
  // Observação livre registrada no histórico (ex.: "Aguardando fonte nova").
  observacao: z
    .string()
    .trim()
    .max(500, 'A observação pode ter no máximo 500 caracteres.')
    .optional()
    .transform((texto) => texto || undefined),
});

export const comentarioSchema = z.object({
  texto: textoLongoSchema('o comentário', 2),
});

// "status" aceita vários valores separados por vírgula (ex.: a "Minha fila"
// pede EM_ATENDIMENTO,AGUARDANDO_PECA de uma vez).
const listaDeStatusSchema = z
  .string()
  .transform((texto) => texto.split(',').filter(Boolean))
  .pipe(z.array(z.enum(StatusChamado, { error: 'Status inválido.' })))
  .optional();

export const listarChamadosSchema = paginacaoSchema.extend({
  status: listaDeStatusSchema,
  tecnicoId: z.coerce.number().int().positive().optional(),
  // "prioridade": mais urgentes e mais antigos primeiro (ordem de fila).
  ordem: z.enum(['recentes', 'prioridade']).default('recentes'),
});

export type DadosCriarChamado = z.infer<typeof criarChamadoSchema>;
export type DadosMudarStatus = z.infer<typeof mudarStatusSchema>;
export type DadosComentario = z.infer<typeof comentarioSchema>;
export type FiltrosChamados = z.infer<typeof listarChamadosSchema>;
