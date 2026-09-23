import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { limparBanco } from './helpers/banco.js';
import { criarSessao } from './helpers/sessao.js';

let admin: string;

beforeEach(async () => {
  await limparBanco();
  ({ cookie: admin } = await criarSessao('ADMIN'));
});

function criarEscola(dados: Record<string, unknown>) {
  return request(app).post('/api/escolas').set('Cookie', admin).send(dados);
}

describe('permissões de /api/escolas', () => {
  it('exige login', async () => {
    expect((await request(app).get('/api/escolas')).status).toBe(401);
  });

  it('bloqueia técnico e solicitante com 403', async () => {
    for (const perfil of ['TECNICO', 'SOLICITANTE'] as const) {
      const { cookie } = await criarSessao(perfil);
      expect((await request(app).get('/api/escolas').set('Cookie', cookie)).status).toBe(403);
      expect(
        (await request(app).post('/api/escolas').set('Cookie', cookie).send({ nome: 'X' })).status,
      ).toBe(403);
    }
  });
});

describe('cadastro de escolas', () => {
  it('cria e busca uma escola', async () => {
    const criada = await criarEscola({
      nome: '  EMEF Rui Barbosa ',
      codigoInep: '35000001',
      endereco: 'Rua A, 1',
    });

    expect(criada.status).toBe(201);
    expect(criada.body).toMatchObject({
      nome: 'EMEF Rui Barbosa',
      codigoInep: '35000001',
      endereco: 'Rua A, 1',
      ativo: true,
    });

    const buscada = await request(app).get(`/api/escolas/${criada.body.id}`).set('Cookie', admin);
    expect(buscada.status).toBe(200);
    expect(buscada.body.id).toBe(criada.body.id);
  });

  it('trata INEP e endereço vazios como ausentes', async () => {
    const criada = await criarEscola({ nome: 'EMEI Sem INEP', codigoInep: '', endereco: '  ' });

    expect(criada.status).toBe(201);
    expect(criada.body).toMatchObject({ codigoInep: null, endereco: null });
  });

  it('valida nome e formato do INEP', async () => {
    const resposta = await criarEscola({ nome: 'AB', codigoInep: '123' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erros).toEqual({
      nome: 'O nome precisa ter pelo menos 3 caracteres.',
      codigoInep: 'O código INEP tem 8 dígitos.',
    });
  });

  it('responde 409 no campo codigoInep quando o INEP já existe', async () => {
    await criarEscola({ nome: 'Escola Um', codigoInep: '35000001' });
    const repetida = await criarEscola({ nome: 'Escola Dois', codigoInep: '35000001' });

    expect(repetida.status).toBe(409);
    expect(repetida.body.erros).toEqual({
      codigoInep: 'Já existe uma escola com este código INEP.',
    });
  });

  it('atualiza a escola substituindo os campos', async () => {
    const { body: escola } = await criarEscola({ nome: 'Escola Velha', endereco: 'Rua B' });

    const resposta = await request(app)
      .put(`/api/escolas/${escola.id}`)
      .set('Cookie', admin)
      .send({ nome: 'Escola Nova', codigoInep: '35000002', endereco: '' });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      nome: 'Escola Nova',
      codigoInep: '35000002',
      endereco: null,
    });
  });

  it('responde 404 para escola inexistente e 400 para id inválido', async () => {
    expect((await request(app).get('/api/escolas/999').set('Cookie', admin)).status).toBe(404);
    expect(
      (await request(app).put('/api/escolas/999').set('Cookie', admin).send({ nome: 'Escola' }))
        .status,
    ).toBe(404);
    expect((await request(app).get('/api/escolas/abc').set('Cookie', admin)).status).toBe(400);
  });
});

describe('listagem de escolas', () => {
  beforeEach(async () => {
    await criarEscola({ nome: 'EMEF Castro Alves', codigoInep: '35000003' });
    await criarEscola({ nome: 'EMEF Anita Garibaldi', codigoInep: '35000001' });
    await criarEscola({ nome: 'EMEI Bárbara Heliodora', codigoInep: '35000002' });
  });

  it('pagina e ordena por nome', async () => {
    const pagina1 = await request(app).get('/api/escolas?porPagina=2').set('Cookie', admin);
    const pagina2 = await request(app)
      .get('/api/escolas?porPagina=2&pagina=2')
      .set('Cookie', admin);

    expect(pagina1.body).toMatchObject({ total: 3, pagina: 1, porPagina: 2 });
    expect(pagina1.body.dados.map((e: { nome: string }) => e.nome)).toEqual([
      'EMEF Anita Garibaldi',
      'EMEF Castro Alves',
    ]);
    expect(pagina2.body.dados.map((e: { nome: string }) => e.nome)).toEqual([
      'EMEI Bárbara Heliodora',
    ]);
  });

  it('busca por nome sem diferenciar maiúsculas e por INEP', async () => {
    const porNome = await request(app).get('/api/escolas?q=castro').set('Cookie', admin);
    const porInep = await request(app).get('/api/escolas?q=35000002').set('Cookie', admin);

    expect(porNome.body.dados.map((e: { nome: string }) => e.nome)).toEqual(['EMEF Castro Alves']);
    expect(porInep.body.dados.map((e: { nome: string }) => e.nome)).toEqual([
      'EMEI Bárbara Heliodora',
    ]);
  });

  it('rejeita paginação inválida', async () => {
    const resposta = await request(app).get('/api/escolas?porPagina=500').set('Cookie', admin);

    expect(resposta.status).toBe(400);
    expect(resposta.body.erros).toHaveProperty('porPagina');
  });
});

describe('desativação (soft delete)', () => {
  it('desativa sem apagar, esconde da lista padrão e permite reativar', async () => {
    const { body: escola } = await criarEscola({ nome: 'Escola Temporária' });

    const desativada = await request(app).delete(`/api/escolas/${escola.id}`).set('Cookie', admin);
    expect(desativada.status).toBe(204);

    const noBanco = await prisma.escola.findUnique({ where: { id: escola.id } });
    expect(noBanco?.ativo).toBe(false);

    const ativas = await request(app).get('/api/escolas').set('Cookie', admin);
    const inativas = await request(app).get('/api/escolas?ativo=inativos').set('Cookie', admin);
    const todas = await request(app).get('/api/escolas?ativo=todos').set('Cookie', admin);
    expect(ativas.body.total).toBe(0);
    expect(inativas.body.total).toBe(1);
    expect(todas.body.total).toBe(1);

    const reativada = await request(app)
      .put(`/api/escolas/${escola.id}`)
      .set('Cookie', admin)
      .send({ nome: escola.nome, ativo: true });
    expect(reativada.body.ativo).toBe(true);
  });
});
