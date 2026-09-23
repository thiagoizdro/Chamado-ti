import { api, statusDoErro } from '../lib/api';
import type { UsuarioLogado } from '../types/usuario';

export type DadosLogin = {
  email: string;
  senha: string;
};

type RespostaUsuario = { usuario: UsuarioLogado };

// null = ninguém logado (a API respondeu 401).
export async function buscarUsuarioLogado(): Promise<UsuarioLogado | null> {
  try {
    const { data } = await api.get<RespostaUsuario>('/auth/me');
    return data.usuario;
  } catch (erro) {
    if (statusDoErro(erro) === 401) return null;
    throw erro;
  }
}

export async function login(dados: DadosLogin): Promise<UsuarioLogado> {
  const { data } = await api.post<RespostaUsuario>('/auth/login', dados);
  return data.usuario;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}
