import type { ParametrosLista, RespostaPaginada } from '../types/paginacao';
import { api } from './api';

// Chamadas padrão de um cadastro REST (GET lista, GET :id, POST, PUT, DELETE).
export function servicoCrud<TItem, TDados>(recurso: string) {
  return {
    async listar(parametros: ParametrosLista) {
      const { data } = await api.get<RespostaPaginada<TItem>>(recurso, { params: parametros });
      return data;
    },
    async buscar(id: number) {
      const { data } = await api.get<TItem>(`${recurso}/${id}`);
      return data;
    },
    async criar(dados: TDados) {
      const { data } = await api.post<TItem>(recurso, dados);
      return data;
    },
    async atualizar(id: number, dados: TDados) {
      const { data } = await api.put<TItem>(`${recurso}/${id}`, dados);
      return data;
    },
    async desativar(id: number) {
      await api.delete(`${recurso}/${id}`);
    },
  };
}

export type ServicoCrud<TItem, TDados> = ReturnType<typeof servicoCrud<TItem, TDados>>;
