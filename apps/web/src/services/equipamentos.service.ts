import { api } from '../lib/api';
import { servicoCrud } from '../lib/crud';
import type { DadosEquipamento, Equipamento, EquipamentoDetalhe } from '../types/cadastros';
import type { ChamadoDoEquipamento } from '../types/chamado';
import type { ParametrosLista, RespostaPaginada } from '../types/paginacao';

export const equipamentosService = servicoCrud<Equipamento, DadosEquipamento, EquipamentoDetalhe>(
  '/equipamentos',
);

export function dadosDoEquipamento(equipamento: Equipamento): DadosEquipamento {
  const { patrimonio, tipo, marca, modelo, localizacao, escolaId } = equipamento;
  return { patrimonio, tipo, marca, modelo, localizacao, escolaId };
}

// Histórico de defeitos da máquina (técnico e admin).
export async function listarChamadosDoEquipamento(id: number, parametros: ParametrosLista) {
  const { data } = await api.get<RespostaPaginada<ChamadoDoEquipamento>>(
    `/equipamentos/${id}/chamados`,
    { params: parametros },
  );
  return data;
}
