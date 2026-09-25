import type { ComponentProps, ReactNode } from 'react';

import { classeCampo, classeRotulo } from './estilos';

type Base = {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
  obrigatorio?: boolean;
};

// Liga rótulo, dica e mensagem de erro ao campo (acessibilidade).
function Envoltorio({
  id,
  rotulo,
  erro,
  dica,
  obrigatorio,
  children,
}: Base & { children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={classeRotulo}>
        {rotulo}
        {obrigatorio && (
          <span className="text-red-700" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {dica && !erro && (
        <p id={`${id}-dica`} className="mt-1 text-sm text-slate-600">
          {dica}
        </p>
      )}
      {erro && (
        <p id={`${id}-erro`} className="mt-1 text-sm text-red-700">
          {erro}
        </p>
      )}
    </div>
  );
}

function atributosAcessibilidade({ id, erro, dica, obrigatorio }: Base) {
  const descricao = erro ? `${id}-erro` : dica ? `${id}-dica` : undefined;
  return {
    id,
    'aria-invalid': erro ? true : undefined,
    'aria-describedby': descricao,
    'aria-required': obrigatorio || undefined,
  };
}

type PropsCampoTexto = Base & Omit<ComponentProps<'input'>, 'id'>;

// Funciona com o register do React Hook Form: <CampoTexto {...register('nome')} />
// (no React 19 o ref chega como prop comum).
export function CampoTexto({ id, rotulo, erro, dica, obrigatorio, ...props }: PropsCampoTexto) {
  const base = { id, rotulo, erro, dica, obrigatorio };
  return (
    <Envoltorio {...base}>
      <input className={classeCampo} {...atributosAcessibilidade(base)} {...props} />
    </Envoltorio>
  );
}

type PropsCampoSelect = Base & Omit<ComponentProps<'select'>, 'id'>;

export function CampoSelect({
  id,
  rotulo,
  erro,
  dica,
  obrigatorio,
  children,
  ...props
}: PropsCampoSelect) {
  const base = { id, rotulo, erro, dica, obrigatorio };
  return (
    <Envoltorio {...base}>
      <select className={classeCampo} {...atributosAcessibilidade(base)} {...props}>
        {children}
      </select>
    </Envoltorio>
  );
}

type PropsCampoAreaTexto = Base & Omit<ComponentProps<'textarea'>, 'id'>;

export function CampoAreaTexto({
  id,
  rotulo,
  erro,
  dica,
  obrigatorio,
  rows = 4,
  ...props
}: PropsCampoAreaTexto) {
  const base = { id, rotulo, erro, dica, obrigatorio };
  return (
    <Envoltorio {...base}>
      <textarea rows={rows} className={classeCampo} {...atributosAcessibilidade(base)} {...props} />
    </Envoltorio>
  );
}
