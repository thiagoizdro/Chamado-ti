import type { Perfil } from './usuario';

// Formatos devolvidos pela API nos cadastros (Fase 3).

export type Escola = {
  id: number;
  nome: string;
  codigoInep: string | null;
  endereco: string | null;
  ativo: boolean;
};

export type DadosEscola = {
  nome: string;
  codigoInep: string | null;
  endereco: string | null;
  ativo?: boolean;
};

export type Categoria = {
  id: number;
  nome: string;
  ativo: boolean;
};

export type DadosCategoria = {
  nome: string;
  ativo?: boolean;
};

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  escolaId: number | null;
  escola: { id: number; nome: string } | null;
  ativo: boolean;
  criadoEm: string;
};

export type DadosUsuario = {
  nome: string;
  email: string;
  perfil: Perfil;
  escolaId: number | null;
  senha?: string;
  ativo?: boolean;
};

export type Equipamento = {
  id: number;
  patrimonio: string;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  localizacao: string | null;
  escolaId: number;
  escola: { id: number; nome: string };
  ativo: boolean;
};

export type EquipamentoDetalhe = Equipamento & { _count: { chamados: number } };

export type DadosEquipamento = {
  patrimonio: string;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  localizacao: string | null;
  escolaId: number;
  ativo?: boolean;
};
