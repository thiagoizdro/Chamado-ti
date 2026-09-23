import type { ComponentProps } from 'react';
import { Link } from 'react-router';

import { classeFoco } from './estilos';

type Variante = 'primario' | 'secundario' | 'perigo' | 'discreto';

const classesVariante: Record<Variante, string> = {
  primario: 'bg-blue-700 text-white hover:bg-blue-800',
  secundario: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  perigo: 'bg-red-700 text-white hover:bg-red-800',
  discreto: 'text-blue-800 hover:bg-blue-50',
};

function classesBotao(variante: Variante, className = '') {
  return (
    'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium ' +
    `disabled:cursor-not-allowed disabled:opacity-60 ${classeFoco} ${classesVariante[variante]} ${className}`
  );
}

type PropsBotao = ComponentProps<'button'> & { variante?: Variante };

export function Botao({ variante = 'primario', className, type = 'button', ...props }: PropsBotao) {
  return <button type={type} className={classesBotao(variante, className)} {...props} />;
}

type PropsLinkBotao = ComponentProps<typeof Link> & { variante?: Variante };

// Link com cara de botão (ex.: "Novo", "Editar").
export function LinkBotao({ variante = 'primario', className, ...props }: PropsLinkBotao) {
  return <Link className={classesBotao(variante, className)} {...props} />;
}
