import axios from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { mensagemDoErro } from './api';

// A API devolve { mensagem, erros: { campo: mensagem } } em 400/409/422.
// Cada erro de um campo que existe no formulário aparece embaixo do campo;
// se nenhum couber, a mensagem geral vai para o topo (errors.root).
export function aplicarErrosDaApi<T extends FieldValues>(
  erro: unknown,
  setError: UseFormSetError<T>,
  campos: readonly string[],
) {
  const erros = axios.isAxiosError<{ erros?: Record<string, string> }>(erro)
    ? erro.response?.data?.erros
    : undefined;

  let aplicouEmCampo = false;
  for (const [campo, mensagem] of Object.entries(erros ?? {})) {
    if (campos.includes(campo)) {
      setError(campo as Path<T>, { message: mensagem }, { shouldFocus: !aplicouEmCampo });
      aplicouEmCampo = true;
    }
  }

  if (!aplicouEmCampo) {
    setError('root', { message: mensagemDoErro(erro, 'Não foi possível salvar.') });
  }
}
