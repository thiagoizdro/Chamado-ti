import {
  CLASSES_PRIORIDADE,
  CLASSES_STATUS,
  ROTULO_PRIORIDADE,
  ROTULO_STATUS,
} from '../lib/chamados';
import type { Prioridade, StatusChamado } from '../types/chamado';

const classeBase = 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap';

export function BadgeStatus({ status }: { status: StatusChamado }) {
  return <span className={`${classeBase} ${CLASSES_STATUS[status]}`}>{ROTULO_STATUS[status]}</span>;
}

export function BadgePrioridade({ prioridade }: { prioridade: Prioridade }) {
  return (
    <span className={`${classeBase} ${CLASSES_PRIORIDADE[prioridade]}`}>
      {ROTULO_PRIORIDADE[prioridade]}
    </span>
  );
}
