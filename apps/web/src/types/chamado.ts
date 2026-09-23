export type StatusChamado = 'ABERTO' | 'EM_ATENDIMENTO' | 'AGUARDANDO_PECA' | 'RESOLVIDO';

export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

// Linha do histórico de defeitos de um equipamento (GET /equipamentos/:id/chamados).
export type ChamadoDoEquipamento = {
  id: number;
  titulo: string;
  status: StatusChamado;
  prioridade: Prioridade;
  solucao: string | null;
  abertoEm: string;
  resolvidoEm: string | null;
  categoria: { id: number; nome: string };
  tecnico: { id: number; nome: string } | null;
};
