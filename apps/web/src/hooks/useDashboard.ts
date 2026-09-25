import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { obterIndicadores } from '../services/dashboard.service';
import type { FiltrosDashboard } from '../types/dashboard';

export function useIndicadores(filtros: FiltrosDashboard) {
  return useQuery({
    queryKey: ['dashboard', filtros],
    queryFn: () => obterIndicadores(filtros),
    // Ao trocar o filtro, os gráficos antigos ficam na tela (esmaecidos) até
    // os novos chegarem: sem "piscar" nem pular o layout.
    placeholderData: keepPreviousData,
  });
}
