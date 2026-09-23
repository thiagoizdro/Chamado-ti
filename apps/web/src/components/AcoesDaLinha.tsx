import { Botao, LinkBotao } from './ui/Botao';

type Props = {
  nome: string;
  ativo: boolean;
  linkEditar: string;
  processando: boolean;
  aoDesativar: () => void;
  aoReativar: () => void;
};

// Ações de uma linha de cadastro. O aria-label diz a qual registro o botão
// se refere (em uma tabela, "Editar" sozinho é ambíguo para leitor de tela).
export function AcoesDaLinha({
  nome,
  ativo,
  linkEditar,
  processando,
  aoDesativar,
  aoReativar,
}: Props) {
  return (
    <div className="flex justify-end gap-1">
      <LinkBotao variante="discreto" to={linkEditar} aria-label={`Editar ${nome}`}>
        Editar
      </LinkBotao>
      {ativo ? (
        <Botao
          variante="discreto"
          onClick={aoDesativar}
          disabled={processando}
          aria-label={`Desativar ${nome}`}
          className="text-red-700 hover:bg-red-50"
        >
          Desativar
        </Botao>
      ) : (
        <Botao
          variante="discreto"
          onClick={aoReativar}
          disabled={processando}
          aria-label={`Reativar ${nome}`}
        >
          Reativar
        </Botao>
      )}
    </div>
  );
}
