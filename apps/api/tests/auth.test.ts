import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { env } from '../src/lib/env.js';
import { prisma } from '../src/lib/prisma.js';
import { criarUsuario, limparBanco, SENHA_TESTE } from './helpers/banco.js';
import { cookieDoToken, logar } from './helpers/sessao.js';

const CREDENCIAIS_INVALIDAS = 'E-mail ou senha inválidos.';

beforeEach(async () => {
  await limparBanco();
});

describe('POST /api/auth/login', () => {
  it('loga, devolve o usuário sem senhaHash e grava o cookie httpOnly', async () => {
    const solicitante = await criarUsuario('SOLICITANTE');

    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: solicitante.email, senha: SENHA_TESTE });

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario).toMatchObject({
      id: solicitante.id,
      email: solicitante.email,
      perfil: 'SOLICITANTE',
      escolaId: solicitante.escolaId,
      escola: { id: solicitante.escolaId },
    });
    expect(resposta.body.usuario).not.toHaveProperty('senhaHash');

    const [cookie] = resposta.headers['set-cookie'] as unknown as string[];
    expect(cookie).toMatch(/^token=/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=28800');
  });

  it('gera o JWT com sub, perfil e escolaId e validade de 8 horas', async () => {
    const solicitante = await criarUsuario('SOLICITANTE');
    const cookie = await logar(solicitante.email);

    const payload = jwt.decode(cookie.replace('token=', '')) as jwt.JwtPayload;

    expect(payload).toMatchObject({
      sub: String(solicitante.id),
      perfil: 'SOLICITANTE',
      escolaId: solicitante.escolaId,
    });
    expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBe(8 * 60 * 60);
  });

  it('aceita e-mail com espaços e letras maiúsculas', async () => {
    const tecnico = await criarUsuario('TECNICO');

    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: `  ${tecnico.email.toUpperCase()} `, senha: SENHA_TESTE });

    expect(resposta.status).toBe(200);
  });

  it('responde 401 com a mesma mensagem para senha errada, e-mail inexistente e usuário inativo', async () => {
    const ativo = await criarUsuario('TECNICO');
    const inativo = await criarUsuario('TECNICO', { ativo: false });

    const tentativas = [
      { email: ativo.email, senha: 'senha-errada' },
      { email: 'ninguem@teste.dev', senha: SENHA_TESTE },
      { email: inativo.email, senha: SENHA_TESTE },
    ];

    for (const credenciais of tentativas) {
      const resposta = await request(app).post('/api/auth/login').send(credenciais);

      expect(resposta.status).toBe(401);
      expect(resposta.body).toEqual({ mensagem: CREDENCIAIS_INVALIDAS });
      expect(resposta.headers['set-cookie']).toBeUndefined();
    }
  });

  it('responde 400 com erros por campo quando os dados são inválidos', async () => {
    const resposta = await request(app).post('/api/auth/login').send({ email: 'nao-e-email' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erros).toEqual({
      email: 'Informe um e-mail válido.',
      senha: 'Informe a senha.',
    });
  });
});

describe('GET /api/auth/me', () => {
  it('devolve o usuário logado sem senhaHash', async () => {
    const admin = await criarUsuario('ADMIN');
    const cookie = await logar(admin.email);

    const resposta = await request(app).get('/api/auth/me').set('Cookie', cookie);

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario).toMatchObject({ id: admin.id, perfil: 'ADMIN', escola: null });
    expect(resposta.body.usuario).not.toHaveProperty('senhaHash');
  });

  it('responde 401 sem cookie', async () => {
    const resposta = await request(app).get('/api/auth/me');

    expect(resposta.status).toBe(401);
  });

  it('responde 401 com token adulterado, assinado com outro segredo ou expirado', async () => {
    const admin = await criarUsuario('ADMIN');
    const cookieValido = await logar(admin.email);
    const payload = { perfil: 'ADMIN', escolaId: null };
    const outroSegredo = 'outro-segredo-qualquer-com-mais-de-32-caracteres';

    const cookies = [
      `${cookieValido}x`,
      `token=${jwt.sign(payload, outroSegredo, { subject: String(admin.id) })}`,
      `token=${jwt.sign(payload, env.JWT_SECRET, { subject: String(admin.id), expiresIn: -10 })}`,
    ];

    for (const cookie of cookies) {
      const resposta = await request(app).get('/api/auth/me').set('Cookie', cookie);
      expect(resposta.status).toBe(401);
    }
  });

  it('corta o acesso na hora quando o usuário é desativado', async () => {
    const tecnico = await criarUsuario('TECNICO');
    const cookie = await logar(tecnico.email);

    await prisma.usuario.update({ where: { id: tecnico.id }, data: { ativo: false } });
    const resposta = await request(app).get('/api/auth/me').set('Cookie', cookie);

    expect(resposta.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('limpa o cookie do token', async () => {
    const admin = await criarUsuario('ADMIN');
    const cookie = await logar(admin.email);

    const resposta = await request(app).post('/api/auth/logout').set('Cookie', cookie);

    expect(resposta.status).toBe(204);
    expect(cookieDoToken(resposta.headers['set-cookie'])).toBe('token=');
    expect(resposta.headers['set-cookie']?.[0]).toContain('Expires=Thu, 01 Jan 1970');
  });
});
