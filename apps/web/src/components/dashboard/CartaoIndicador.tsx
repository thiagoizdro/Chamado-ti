import type { ReactNode } from 'react';

type Props = {
  rotulo: string;
  valor: string;
  detalhe?: ReactNode;
  // Marcador de cor (ex.: cor do status); o rótulo sempre acompanha.
  marcador?: string;
};

// Cartão de KPI: rótulo, valor em destaque e um detalhe opcional.
export function CartaoIndicador({ rotulo, valor, detalhe, marcador }: Props) {
  return (
    <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
      <dt className="flex items-center gap-2 text-sm text-slate-600">
        {marcador && <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${marcador}`} />}
        {rotulo}
      </dt>
      <dd className="mt-1 text-3xl font-semibold text-slate-900">{valor}</dd>
      {detalhe && <dd className="mt-1 text-sm text-slate-600">{detalhe}</dd>}
    </div>
  );
}
