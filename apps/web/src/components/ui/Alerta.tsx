import type { ReactNode } from 'react';

type Tipo = 'erro' | 'sucesso';

const classes: Record<Tipo, string> = {
  erro: 'bg-red-50 text-red-800 ring-red-200',
  sucesso: 'bg-green-50 text-green-800 ring-green-200',
};

// Erros interrompem o leitor de tela (role="alert"); sucesso é anunciado com calma.
export function Alerta({ tipo, children }: { tipo: Tipo; children: ReactNode }) {
  return (
    <div
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={`rounded-md px-4 py-3 text-sm ring-1 ${classes[tipo]}`}
    >
      {children}
    </div>
  );
}
