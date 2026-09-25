import { useOpcoesEscolas } from '../../hooks/useOpcoesEscolas';
import { type Periodo, PERIODOS } from '../../lib/periodos';
import { CampoSelect, CampoTexto } from '../ui/Campo';
import { classeFoco, classeRotulo } from '../ui/estilos';

type Props = {
  periodo: Periodo;
  de: string;
  ate: string;
  escolaId: string;
  periodoInvalido: boolean;
  aoMudar: (alteracoes: Record<string, string | undefined>) => void;
};

// Uma linha de filtros acima de tudo: período primeiro (atalhos antes do
// intervalo personalizado) e escola. Todos os indicadores usam o mesmo recorte.
export function FiltrosDashboard({ periodo, de, ate, escolaId, periodoInvalido, aoMudar }: Props) {
  const escolas = useOpcoesEscolas();

  return (
    <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg bg-white p-4 ring-1 ring-slate-200">
      <fieldset>
        <legend className={classeRotulo}>Período (data de abertura)</legend>
        <div className="mt-1 flex flex-wrap gap-1">
          {PERIODOS.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              aria-pressed={periodo === opcao.valor}
              onClick={() =>
                aoMudar({
                  periodo: opcao.valor,
                  // Datas personalizadas só fazem sentido no modo personalizado.
                  ...(opcao.valor !== 'personalizado' && { de: undefined, ate: undefined }),
                })
              }
              className={`rounded-md px-3 py-2 text-sm font-medium ${classeFoco} ${
                periodo === opcao.valor
                  ? 'bg-blue-700 text-white'
                  : 'bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50'
              }`}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </fieldset>

      {periodo === 'personalizado' && (
        <>
          <div className="w-40">
            <CampoTexto
              id="dashboard-de"
              type="date"
              rotulo="De"
              value={de}
              onChange={(evento) => aoMudar({ de: evento.target.value })}
            />
          </div>
          <div className="w-40">
            <CampoTexto
              id="dashboard-ate"
              type="date"
              rotulo="Até"
              min={de || undefined}
              value={ate}
              erro={periodoInvalido ? 'Precisa ser igual ou depois de "De".' : undefined}
              onChange={(evento) => aoMudar({ ate: evento.target.value })}
            />
          </div>
        </>
      )}

      <div className="w-full sm:w-64">
        <CampoSelect
          id="dashboard-escola"
          rotulo="Escola"
          value={escolaId}
          onChange={(evento) => aoMudar({ escolaId: evento.target.value })}
        >
          <option value="">Toda a rede</option>
          {escolas.opcoes.map((escola) => (
            <option key={escola.id} value={escola.id}>
              {escola.nome}
            </option>
          ))}
        </CampoSelect>
      </div>
    </div>
  );
}
