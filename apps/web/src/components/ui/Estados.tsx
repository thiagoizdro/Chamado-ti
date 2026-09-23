import { Botao } from './Botao';

// Estados padrão de qualquer tela que busca dados: carregando, erro e vazio.

export function EstadoCarregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <p role="status" className="py-8 text-center text-slate-600">
      {texto}
    </p>
  );
}

export function EstadoErro({
  mensagem,
  aoTentarNovamente,
}: {
  mensagem: string;
  aoTentarNovamente?: () => void;
}) {
  return (
    <div role="alert" className="rounded-md bg-red-50 px-4 py-6 text-center ring-1 ring-red-200">
      <p className="text-red-800">{mensagem}</p>
      {aoTentarNovamente && (
        <Botao variante="secundario" className="mt-3" onClick={aoTentarNovamente}>
          Tentar novamente
        </Botao>
      )}
    </div>
  );
}

export function EstadoVazio({ mensagem }: { mensagem: string }) {
  return (
    <p className="rounded-md bg-white px-4 py-8 text-center text-slate-600 ring-1 ring-slate-200">
      {mensagem}
    </p>
  );
}
