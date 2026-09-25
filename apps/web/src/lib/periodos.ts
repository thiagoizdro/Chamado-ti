import { dataISO, diasAtras } from './datas';

// Atalhos de período do dashboard. Na URL fica o atalho ("30"), não as datas:
// um link salvo para "últimos 30 dias" continua valendo amanhã.
export type Periodo = '7' | '30' | '90' | '180' | 'tudo' | 'personalizado';

export const PERIODOS: { valor: Periodo; rotulo: string }[] = [
  { valor: '7', rotulo: '7 dias' },
  { valor: '30', rotulo: '30 dias' },
  { valor: '90', rotulo: '90 dias' },
  { valor: '180', rotulo: '6 meses' },
  { valor: 'tudo', rotulo: 'Tudo' },
  { valor: 'personalizado', rotulo: 'Personalizado' },
];

export const PERIODO_PADRAO: Periodo = '30';

export function lerPeriodo(valor: string | null): Periodo {
  return PERIODOS.some((periodo) => periodo.valor === valor) ? (valor as Periodo) : PERIODO_PADRAO;
}

// Converte o atalho em datas para a API. "Últimos N dias" inclui hoje.
export function datasDoPeriodo(
  periodo: Periodo,
  personalizado: { de: string; ate: string },
  hoje = new Date(),
): { de?: string; ate?: string } {
  if (periodo === 'tudo') return {};
  if (periodo === 'personalizado') {
    return { de: personalizado.de || undefined, ate: personalizado.ate || undefined };
  }
  return { de: diasAtras(Number(periodo) - 1, hoje), ate: dataISO(hoje) };
}
