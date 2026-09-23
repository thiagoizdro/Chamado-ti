export type RespostaPaginada<T> = {
  dados: T[];
  total: number;
  pagina: number;
  porPagina: number;
};

export type FiltroAtivo = 'ativos' | 'inativos' | 'todos';

// Parâmetros de query aceitos pelas listas da API (undefined = não enviar).
export type ParametrosLista = Record<string, string | number | undefined>;
