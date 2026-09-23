import type { ReactNode } from 'react';

export type Coluna<T> = {
  titulo: string;
  celula: (item: T) => ReactNode;
  className?: string;
};

type Props<T> = {
  legenda: string;
  colunas: Coluna<T>[];
  itens: T[];
  chave: (item: T) => string | number;
};

// Tabela simples; em telas estreitas rola na horizontal dentro do próprio quadro.
export function Tabela<T>({ legenda, colunas, itens, chave }: Props<T>) {
  return (
    <div className="overflow-x-auto rounded-lg bg-white ring-1 ring-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <caption className="sr-only">{legenda}</caption>
        <thead className="bg-slate-50">
          <tr>
            {colunas.map((coluna) => (
              <th
                key={coluna.titulo}
                scope="col"
                className={`px-4 py-3 text-left font-semibold whitespace-nowrap text-slate-700 ${coluna.className ?? ''}`}
              >
                {coluna.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {itens.map((item) => (
            <tr key={chave(item)} className="hover:bg-slate-50">
              {colunas.map((coluna) => (
                <td
                  key={coluna.titulo}
                  className={`px-4 py-3 text-slate-800 ${coluna.className ?? ''}`}
                >
                  {coluna.celula(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
