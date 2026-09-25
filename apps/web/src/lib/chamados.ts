import type { Prioridade, StatusChamado } from '../types/chamado';

// Rótulos e cores de status/prioridade: a mesma cor em todo o app.

export const ROTULO_STATUS: Record<StatusChamado, string> = {
  ABERTO: 'Aberto',
  EM_ATENDIMENTO: 'Em atendimento',
  AGUARDANDO_PECA: 'Aguardando peça',
  RESOLVIDO: 'Resolvido',
};

export const CLASSES_STATUS: Record<StatusChamado, string> = {
  ABERTO: 'bg-blue-100 text-blue-800',
  EM_ATENDIMENTO: 'bg-amber-100 text-amber-900',
  AGUARDANDO_PECA: 'bg-purple-100 text-purple-800',
  RESOLVIDO: 'bg-green-100 text-green-800',
};

export const ROTULO_PRIORIDADE: Record<Prioridade, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

export const CLASSES_PRIORIDADE: Record<Prioridade, string> = {
  BAIXA: 'bg-slate-100 text-slate-700',
  MEDIA: 'bg-sky-100 text-sky-800',
  ALTA: 'bg-orange-100 text-orange-800',
  CRITICA: 'bg-red-100 text-red-800',
};

export const PRIORIDADES: Prioridade[] = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];

// Espelho da máquina de estados da API (modules/chamados/status.ts), usado só
// para decidir quais botões mostrar. Quem valida de verdade é a API.
// Sair de ABERTO é pelo botão "Assumir", por isso ABERTO não tem transições aqui.
// Nenhuma transição volta para ABERTO (reabertura está fora do MVP).
export type DestinoStatus = Exclude<StatusChamado, 'ABERTO'>;

export const PROXIMOS_STATUS: Record<StatusChamado, DestinoStatus[]> = {
  ABERTO: [],
  EM_ATENDIMENTO: ['AGUARDANDO_PECA', 'RESOLVIDO'],
  AGUARDANDO_PECA: ['EM_ATENDIMENTO'],
  RESOLVIDO: [],
};

// Texto do botão de cada transição, a partir do status de destino.
export const ROTULO_ACAO_STATUS: Record<DestinoStatus, string> = {
  EM_ATENDIMENTO: 'Retomar atendimento',
  AGUARDANDO_PECA: 'Aguardar peça',
  RESOLVIDO: 'Resolver',
};
