import { api } from '../lib/api';
import type { FiltrosDashboard, Indicadores } from '../types/dashboard';

export async function obterIndicadores(filtros: FiltrosDashboard) {
  const { data } = await api.get<Indicadores>('/dashboard', { params: filtros });
  return data;
}
