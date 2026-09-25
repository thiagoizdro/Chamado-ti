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

export type AcaoHistorico =
  'CRIADO' | 'ATRIBUIDO' | 'STATUS_ALTERADO' | 'COMENTARIO' | 'SOLUCAO_REGISTRADA';

type Referencia = { id: number; nome: string };

// Linha de GET /chamados.
export type ChamadoResumo = {
  id: number;
  titulo: string;
  status: StatusChamado;
  prioridade: Prioridade;
  abertoEm: string;
  resolvidoEm: string | null;
  escola: Referencia;
  categoria: Referencia;
  equipamento: { id: number; patrimonio: string; tipo: string } | null;
  solicitante: Referencia;
  tecnico: Referencia | null;
};

export type RegistroHistorico = {
  id: number;
  acao: AcaoHistorico;
  statusAnterior: StatusChamado | null;
  statusNovo: StatusChamado | null;
  descricao: string | null;
  criadoEm: string;
  usuario: Referencia;
};

// GET /chamados/:id (e resposta das ações de atendimento).
export type ChamadoDetalhe = ChamadoResumo & {
  descricao: string;
  solucao: string | null;
  atualizadoEm: string;
  historico: RegistroHistorico[];
};

export type DadosAbrirChamado = {
  titulo: string;
  descricao: string;
  prioridade: Prioridade;
  categoriaId: number;
  equipamentoId: number | null;
  escolaId: number | null;
};

export type DadosMudarStatus = {
  status: StatusChamado;
  solucao?: string;
  observacao?: string;
};
