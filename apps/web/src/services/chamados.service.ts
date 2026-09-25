import { api } from '../lib/api';
import type {
  ChamadoDetalhe,
  ChamadoResumo,
  DadosAbrirChamado,
  DadosMudarStatus,
  RegistroHistorico,
} from '../types/chamado';
import type { ParametrosLista, RespostaPaginada } from '../types/paginacao';

export async function listarChamados(parametros: ParametrosLista) {
  const { data } = await api.get<RespostaPaginada<ChamadoResumo>>('/chamados', {
    params: parametros,
  });
  return data;
}

export async function buscarChamado(id: number) {
  const { data } = await api.get<ChamadoDetalhe>(`/chamados/${id}`);
  return data;
}

export async function abrirChamado(dados: DadosAbrirChamado) {
  const { data } = await api.post<ChamadoDetalhe>('/chamados', dados);
  return data;
}

export async function assumirChamado(id: number) {
  const { data } = await api.patch<ChamadoDetalhe>(`/chamados/${id}/assumir`);
  return data;
}

export async function mudarStatusChamado(id: number, dados: DadosMudarStatus) {
  const { data } = await api.patch<ChamadoDetalhe>(`/chamados/${id}/status`, dados);
  return data;
}

export async function comentarChamado(id: number, texto: string) {
  const { data } = await api.post<RegistroHistorico>(`/chamados/${id}/comentarios`, { texto });
  return data;
}
