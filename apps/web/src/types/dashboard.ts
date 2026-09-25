import type { StatusChamado } from './chamado';

export type Contagem = { id: number; nome: string; total: number };

export type EquipamentoRanking = {
  id: number;
  patrimonio: string;
  tipo: string;
  modelo: string | null;
  escola: { id: number; nome: string };
  total: number;
};

// GET /dashboard
export type Indicadores = {
  total: number;
  porStatus: Record<StatusChamado, number>;
  porEscola: Contagem[];
  porCategoria: Contagem[];
  topEquipamentos: EquipamentoRanking[];
  tempoMedioResolucao: { horas: number | null; chamadosResolvidos: number };
};

export type FiltrosDashboard = { de?: string; ate?: string; escolaId?: string };
