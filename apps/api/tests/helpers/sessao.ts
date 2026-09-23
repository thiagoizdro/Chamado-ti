import request from 'supertest';

import { app } from '../../src/app.js';
import { SENHA_TESTE } from './banco.js';

// Faz login e devolve o cabeçalho Cookie para usar nas próximas requisições.
export async function logar(email: string): Promise<string> {
  const resposta = await request(app).post('/api/auth/login').send({ email, senha: SENHA_TESTE });
  if (resposta.status !== 200) {
    throw new Error(`Login de teste falhou (${resposta.status}): ${JSON.stringify(resposta.body)}`);
  }
  return cookieDoToken(resposta.headers['set-cookie']);
}

export function cookieDoToken(setCookie: string | string[] | undefined): string {
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const token = cookies.find((cookie) => cookie.startsWith('token='));
  if (!token) {
    throw new Error('Resposta sem cookie "token"');
  }
  return token.split(';')[0] ?? '';
}
