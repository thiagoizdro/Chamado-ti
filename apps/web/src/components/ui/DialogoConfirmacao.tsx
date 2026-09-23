import { useEffect, useRef } from 'react';

import { Botao } from './Botao';

type Props = {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  textoConfirmar: string;
  perigoso?: boolean;
  processando?: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
};

// Usa o <dialog> nativo: o navegador já cuida do foco, do Esc e do fundo inerte.
export function DialogoConfirmacao({
  aberto,
  titulo,
  mensagem,
  textoConfirmar,
  perigoso = false,
  processando = false,
  aoConfirmar,
  aoCancelar,
}: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    if (aberto && !elemento.open) elemento.showModal();
    if (!aberto && elemento.open) elemento.close();
  }, [aberto]);

  return (
    <dialog
      ref={dialogo}
      onCancel={aoCancelar}
      aria-labelledby="dialogo-titulo"
      aria-describedby="dialogo-mensagem"
      className="m-auto w-full max-w-md rounded-lg p-6 shadow-xl backdrop:bg-slate-900/40"
    >
      <h2 id="dialogo-titulo" className="text-lg font-semibold text-slate-900">
        {titulo}
      </h2>
      <p id="dialogo-mensagem" className="mt-2 text-slate-700">
        {mensagem}
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Botao variante="secundario" onClick={aoCancelar} disabled={processando}>
          Cancelar
        </Botao>
        <Botao
          variante={perigoso ? 'perigo' : 'primario'}
          onClick={aoConfirmar}
          disabled={processando}
        >
          {processando ? 'Aguarde…' : textoConfirmar}
        </Botao>
      </div>
    </dialog>
  );
}
