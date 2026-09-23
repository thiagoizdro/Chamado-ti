import { useCallback, useEffect, useRef } from 'react';

// Devolve uma versão da função que só executa depois de "atrasoMs" sem novas
// chamadas (ex.: buscar só quando o usuário para de digitar).
export function useDebounce<A extends unknown[]>(
  funcao: (...argumentos: A) => void,
  atrasoMs: number,
) {
  const funcaoAtual = useRef(funcao);
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sempre chama a versão mais recente da função, sem recriar o debounce.
  useEffect(() => {
    funcaoAtual.current = funcao;
  });

  useEffect(() => () => clearTimeout(temporizador.current), []);

  return useCallback(
    (...argumentos: A) => {
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => funcaoAtual.current(...argumentos), atrasoMs);
    },
    [atrasoMs],
  );
}
