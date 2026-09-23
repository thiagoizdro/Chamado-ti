import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { equipamentosService, listarChamadosDoEquipamento } from '../services/equipamentos.service';
import type { ParametrosLista } from '../types/paginacao';
import { criarHooksCrud } from './criarHooksCrud';

export const {
  useLista: useListaEquipamentos,
  useItem: useEquipamento,
  useSalvar: useSalvarEquipamento,
  useDesativar: useDesativarEquipamento,
} = criarHooksCrud('equipamentos', equipamentosService);

export function useChamadosDoEquipamento(id: number, parametros: ParametrosLista) {
  return useQuery({
    queryKey: ['equipamentos', 'chamados', id, parametros],
    queryFn: () => listarChamadosDoEquipamento(id, parametros),
    placeholderData: keepPreviousData,
  });
}
