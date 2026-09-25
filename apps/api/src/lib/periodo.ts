import { z } from 'zod';

// As datas ficam em UTC no banco, mas "de 01/09 até 30/09" é no horário da
// rede de ensino. O Brasil não tem mais horário de verão, então o fuso de
// Brasília é fixo em -03:00.
const FUSO_DA_REDE = '-03:00';
const DIA_EM_MS = 24 * 60 * 60 * 1000;

// Data de calendário vinda da query string (ex.: ?de=2026-09-01).
export const dataSchema = z.iso.date({ error: 'Use uma data no formato AAAA-MM-DD.' }).optional();

// Período com "ate" inclusivo (o dia inteiro conta). Os campos e a regra ficam
// separados porque no Zod 4 um objeto com refine não pode mais ser estendido:
// cada schema junta os campos e aplica .refine(periodoValido, erroPeriodo) no final.
export const camposPeriodo = { de: dataSchema, ate: dataSchema };

export function periodoValido({ de, ate }: { de?: string; ate?: string }) {
  return !de || !ate || de <= ate;
}

export const erroPeriodo = {
  message: 'A data final precisa ser igual ou posterior à inicial.',
  path: ['ate'],
};

export function inicioDoDia(data: string): Date {
  return new Date(`${data}T00:00:00${FUSO_DA_REDE}`);
}

// Filtro de DateTime para o Prisma: [início de "de", início do dia seguinte a "ate").
export function intervaloDoPeriodo({ de, ate }: { de?: string; ate?: string }) {
  if (!de && !ate) return undefined;
  return {
    ...(de && { gte: inicioDoDia(de) }),
    ...(ate && { lt: new Date(inicioDoDia(ate).getTime() + DIA_EM_MS) }),
  };
}
