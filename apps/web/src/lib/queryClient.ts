import { QueryClient } from '@tanstack/react-query';

import { statusDoErro } from './api';

// Erros que não adianta repetir: tentar de novo daria o mesmo resultado.
const STATUS_SEM_RETRY = [400, 401, 403, 404, 409, 422];

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (tentativas, erro) => {
        const status = statusDoErro(erro);
        if (status && STATUS_SEM_RETRY.includes(status)) return false;
        return tentativas < 2;
      },
    },
  },
});
