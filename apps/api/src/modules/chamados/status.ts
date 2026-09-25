import type { StatusChamado } from '../../generated/prisma/enums.js';

// Máquina de estados do chamado: para cada status, os próximos permitidos.
// Reabertura (sair de RESOLVIDO) está fora do MVP.
export const TRANSICOES_STATUS: Record<StatusChamado, readonly StatusChamado[]> = {
  ABERTO: ['EM_ATENDIMENTO'],
  EM_ATENDIMENTO: ['AGUARDANDO_PECA', 'RESOLVIDO'],
  AGUARDANDO_PECA: ['EM_ATENDIMENTO'],
  RESOLVIDO: [],
};

// Rótulos usados nas mensagens de erro para o usuário.
export const ROTULO_STATUS: Record<StatusChamado, string> = {
  ABERTO: 'Aberto',
  EM_ATENDIMENTO: 'Em atendimento',
  AGUARDANDO_PECA: 'Aguardando peça',
  RESOLVIDO: 'Resolvido',
};

export function podeTransitar(de: StatusChamado, para: StatusChamado): boolean {
  return TRANSICOES_STATUS[de].includes(para);
}
