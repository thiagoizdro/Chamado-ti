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

function criarCategoria(nome: string) {
  return request(app).post('/api/categorias').set('Cookie', admin).send({ nome });
}

const nomes = (resposta: request.Response) =>
  resposta.body.dados.map((categoria: { nome: string }) => categoria.nome);

describe('leitura de categorias', () => {
  beforeEach(async () => {
    await criarCategoria('Software');
    await criarCategoria('Impressora');
    const { body: inativa } = await criarCategoria('Fax');
    await request(app).delete(`/api/categorias/${inativa.id}`).set('Cookie', admin);
  });

  it('libera a listagem para qualquer perfil logado, só com as ativas', async () => {
    for (const perfil of ['TECNICO', 'SOLICITANTE'] as const) {
      const { cookie } = await criarSessao(perfil);

      const resposta = await request(app).get('/api/categorias?ativo=todos').set('Cookie', cookie);

      expect(resposta.status).toBe(200);
      expect(nomes(resposta)).toEqual(['Impressora', 'Software']);
    }
  });

  it('deixa o admin filtrar inativas', async () => {
    const resposta = await request(app).get('/api/categorias?ativo=inativos').set('Cookie', admin);

    expect(nomes(resposta)).toEqual(['Fax']);
  });

  it('exige login', async () => {
    expect((await request(app).get('/api/categorias')).status).toBe(401);
  });
});

describe('escrita de categorias', () => {
  it('bloqueia técnico e solicitante com 403', async () => {
    const { body: categoria } = await criarCategoria('Rede');

    for (const perfil of ['TECNICO', 'SOLICITANTE'] as const) {
      const { cookie } = await criarSessao(perfil);
      const post = await request(app)
        .post('/api/categorias')
        .set('Cookie', cookie)
        .send({ nome: 'Nova' });
      const put = await request(app)
        .put(`/api/categorias/${categoria.id}`)
        .set('Cookie', cookie)
        .send({ nome: 'Outra' });
      const del = await request(app)
        .delete(`/api/categorias/${categoria.id}`)
        .set('Cookie', cookie);

      expect([post.status, put.status, del.status]).toEqual([403, 403, 403]);
    }
  });

  it('cria, renomeia e desativa', async () => {
    const criada = await criarCategoria('  Scanner ');
    expect(criada.status).toBe(201);
    expect(criada.body).toMatchObject({ nome: 'Scanner', ativo: true });

    const renomeada = await request(app)
      .put(`/api/categorias/${criada.body.id}`)
      .set('Cookie', admin)
      .send({ nome: 'Scanner e digitalização' });
    expect(renomeada.body.nome).toBe('Scanner e digitalização');

    const desativada = await request(app)
      .delete(`/api/categorias/${criada.body.id}`)
      .set('Cookie', admin);
    expect(desativada.status).toBe(204);
    const noBanco = await prisma.categoria.findUnique({ where: { id: criada.body.id } });
    expect(noBanco?.ativo).toBe(false);
  });

  it('não aceita nome repetido, mesmo com maiúsculas diferentes', async () => {
    await criarCategoria('Impressora');

    const repetida = await criarCategoria('IMPRESSORA');

    expect(repetida.status).toBe(409);
    expect(repetida.body.erros).toEqual({ nome: 'Já existe uma categoria com este nome.' });
  });

  it('permite salvar a própria categoria sem mudar o nome', async () => {
    const { body: categoria } = await criarCategoria('Projetor');

    const resposta = await request(app)
      .put(`/api/categorias/${categoria.id}`)
      .set('Cookie', admin)
      .send({ nome: 'projetor' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.nome).toBe('projetor');
  });

  it('responde 404 para categoria inexistente', async () => {
    const resposta = await request(app)
      .put('/api/categorias/999')
      .set('Cookie', admin)
      .send({ nome: 'Qualquer' });

    expect(resposta.status).toBe(404);
  });
});
