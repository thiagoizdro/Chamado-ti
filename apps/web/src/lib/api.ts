import axios from 'axios';

// Mesma origem: o proxy do Vite (dev) e o rewrite da Vercel (produção)
// encaminham /api para a API. O cookie de sessão vai junto automaticamente.
export const api = axios.create({ baseURL: '/api' });

let aoPerderSessao: (() => void) | null = null;

// O AuthProvider registra aqui o que fazer quando a API responder 401.
// Devolve uma função para remover o registro.
export function definirAoPerderSessao(callback: () => void) {
  aoPerderSessao = callback;
  return () => {
    aoPerderSessao = null;
  };
}

api.interceptors.response.use(
  (resposta) => resposta,
  (erro: unknown) => {
    // 401 no login é só "senha errada", não perda de sessão.
    const ehLogin = axios.isAxiosError(erro) && erro.config?.url === '/auth/login';
    if (axios.isAxiosError(erro) && erro.response?.status === 401 && !ehLogin) {
      aoPerderSessao?.();
    }
    return Promise.reject(erro);
  },
);

export function statusDoErro(erro: unknown): number | undefined {
  return axios.isAxiosError(erro) ? erro.response?.status : undefined;
}

// Mensagem amigável: usa a "mensagem" que a API devolve quando existir.
export function mensagemDoErro(
  erro: unknown,
  padrao = 'Não foi possível concluir a operação. Tente novamente.',
): string {
  if (axios.isAxiosError<{ mensagem?: string }>(erro)) {
    if (!erro.response) return 'Não foi possível conectar ao servidor.';
    return erro.response.data?.mensagem ?? padrao;
  }
  return padrao;
}
