import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../src/lib/AppError.js';
import { prisma } from '../src/lib/prisma.js';
import { autenticar } from '../src/middlewares/autenticar.js';
import { autorizar } from '../src/middlewares/autorizar.js';
import { tratarErro } from '../src/middlewares/erro.js';
import { criarUsuario, limparBanco } from './helpers/banco.js';
import { logar } from './helpers/sessao.js';

// App mínimo só com as rotas que exercitam os middlewares.
const app = express();
app.use(cookieParser());
app.get('/so-admin', autenticar, autorizar('ADMIN'), (_req, res) => {
  res.json({ ok: true });
});
app.get('/tecnico-ou-admin', autenticar, autorizar('TECNICO', 'ADMIN'), (_req, res) => {
  res.json({ ok: true });
});
app.get('/app-error', () => {
  throw new AppError(422, 'Transição de status inválida.');
});
app.get('/duplicado', async (_req, res) => {
  await prisma.escola.create({ data: { nome: 'A', codigoInep: '11111111' } });
  await prisma.escola.create({ data: { nome: 'B', codigoInep: '11111111' } });
  res.json({ ok: true });
});
app.get('/inesperado', () => {
  throw new Error('bug interno com detalhes que não podem vazar');
});
app.use(tratarErro);

beforeEach(async () => {
  await limparBanco();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('autorizar', () => {
  it('libera o perfil permitido e bloqueia os demais com 403', async () => {
    const admin = await logar((await criarUsuario('ADMIN')).email);
    const tecnico = await logar((await criarUsuario('TECNICO')).email);
    const solicitante = await logar((await criarUsuario('SOLICITANTE')).email);

    expect((await request(app).get('/so-admin').set('Cookie', admin)).status).toBe(200);
    expect((await request(app).get('/so-admin').set('Cookie', tecnico)).status).toBe(403);
    expect((await request(app).get('/so-admin').set('Cookie', solicitante)).status).toBe(403);

    expect((await request(app).get('/tecnico-ou-admin').set('Cookie', tecnico)).status).toBe(200);
    expect((await request(app).get('/tecnico-ou-admin').set('Cookie', admin)).status).toBe(200);
    const bloqueado = await request(app).get('/tecnico-ou-admin').set('Cookie', solicitante);
    expect(bloqueado.status).toBe(403);
    expect(bloqueado.body).toEqual({
      mensagem: 'Você não tem permissão para acessar este recurso.',
    });
  });

  it('usa o perfil atual do banco, não o que está no token', async () => {
    const usuario = await criarUsuario('ADMIN');
    const cookie = await logar(usuario.email);

    await prisma.usuario.update({ where: { id: usuario.id }, data: { perfil: 'TECNICO' } });

    expect((await request(app).get('/so-admin').set('Cookie', cookie)).status).toBe(403);
  });

  it('responde 401 antes de checar o perfil quando não há login', async () => {
    expect((await request(app).get('/so-admin')).status).toBe(401);
  });
});

describe('tratarErro', () => {
  it('devolve status e mensagem do AppError', async () => {
    const resposta = await request(app).get('/app-error');

    expect(resposta.status).toBe(422);
    expect(resposta.body).toEqual({ mensagem: 'Transição de status inválida.' });
  });

  it('traduz violação de unicidade do Prisma (P2002) para 409', async () => {
    const resposta = await request(app).get('/duplicado');

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({ mensagem: 'Já existe um registro com esse valor.' });
  });

  it('esconde detalhes de erros inesperados atrás de um 500 genérico', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const resposta = await request(app).get('/inesperado');

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ mensagem: 'Erro interno do servidor.' });
  });
});
