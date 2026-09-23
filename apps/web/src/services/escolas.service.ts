import { servicoCrud } from '../lib/crud';
import type { DadosEscola, Escola } from '../types/cadastros';

export const escolasService = servicoCrud<Escola, DadosEscola>('/escolas');

// PUT substitui o cadastro inteiro: usado para reativar mantendo os dados.
export function dadosDaEscola({ nome, codigoInep, endereco }: Escola): DadosEscola {
  return { nome, codigoInep, endereco };
}
