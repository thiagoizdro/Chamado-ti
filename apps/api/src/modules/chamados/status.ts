import type { StatusChamado } from '../../generated/prisma/enums.js';

// Máquina de estados do chamado: para cada status, os próximos permitidos.
// Reabertura (sair de RESOLVIDO) está fora do MVP.
export const TRANSICOES_STATUS: Record<StatusChamado, readonly StatusChamado[]> = {
  ABERTO: ['EM_ATENDIMENTO'],
  EM_ATENDIMENTO: ['AGUARDANDO_PECA', 'RESOLVIDO'],
  AGUARDANDO_PECA: ['EM_ATENDIMENTO'],
  RESOLVIDO: [],
};

export function podeTransitar(de: StatusChamado, para: StatusChamado): boolean {
  return TRANSICOES_STATUS[de].includes(para);
}
