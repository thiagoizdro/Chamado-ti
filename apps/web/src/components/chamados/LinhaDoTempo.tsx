import { ROTULO_STATUS } from '../../lib/chamados';
import { formatarDataHora } from '../../lib/datas';
import type { AcaoHistorico, RegistroHistorico } from '../../types/chamado';

// Cor do marcador de cada tipo de registro.
const CLASSES_MARCADOR: Record<AcaoHistorico, string> = {
  CRIADO: 'bg-blue-600',
  ATRIBUIDO: 'bg-amber-500',
  STATUS_ALTERADO: 'bg-slate-500',
  COMENTARIO: 'bg-sky-500',
  SOLUCAO_REGISTRADA: 'bg-green-600',
};

function descreverAcao(registro: RegistroHistorico): string {
  const { acao, statusAnterior, statusNovo } = registro;
  switch (acao) {
    case 'CRIADO':
      return 'abriu o chamado';
    case 'ATRIBUIDO':
      return 'assumiu o chamado';
    case 'STATUS_ALTERADO':
      return statusAnterior && statusNovo
        ? `mudou o status de "${ROTULO_STATUS[statusAnterior]}" para "${ROTULO_STATUS[statusNovo]}"`
        : 'mudou o status';
    case 'COMENTARIO':
      return 'comentou';
    case 'SOLUCAO_REGISTRADA':
      return 'registrou a solução';
  }
}

export function LinhaDoTempo({ historico }: { historico: RegistroHistorico[] }) {
  return (
    <ol className="relative space-y-5 border-l border-slate-200 pl-6">
      {historico.map((registro) => (
        <li key={registro.id} className="relative">
          <span
            aria-hidden="true"
            className={`absolute top-1.5 -left-[1.95rem] h-3 w-3 rounded-full ring-4 ring-white ${CLASSES_MARCADOR[registro.acao]}`}
          />
          <p className="text-sm text-slate-900">
            <span className="font-medium">{registro.usuario.nome}</span> {descreverAcao(registro)}
          </p>
          <p className="text-xs text-slate-600">
            <time dateTime={registro.criadoEm}>{formatarDataHora(registro.criadoEm)}</time>
          </p>
          {registro.descricao && (
            <p className="mt-1.5 rounded-md bg-slate-50 px-3 py-2 text-sm whitespace-pre-line text-slate-800 ring-1 ring-slate-200">
              {registro.descricao}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
