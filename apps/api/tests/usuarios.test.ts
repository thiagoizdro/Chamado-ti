import bcrypt from 'bcrypt';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { criarEscola, criarUsuario, limparBanco } from './helpers/banco.js';
import { criarSessao } from './helpers/sessao.js';

let admin: string;
let adminId: number;

beforeEach(async () => {
  await limparBanco();
  const sessao = await criarSessao('ADMIN');
  admin = sessao.cookie;
  adminId = sessao.usuario.id;
});

function criar(dados: Record<string, unknown>) {
  return request(app).post('/api/usuarios').set('Cookie', admin).send(dados);
}

function atualizar(id: number, dados: Record<string, unknown>) {
  return request(app).put(`/api/usuarios/${id}`).set('Cookie', admin).send(dados);
}

function tentarLogin(email: string, senha: string) {
  return request(app).post('/api/auth/login').send({ email, senha });
}

describe('permissões de /api/usuarios', () => {
  it('bloqueia técnico e solicitante com 403', async () => {
    for (const perfil of ['TECNICO', 'SOLICITANTE'] as const) {
      const { cookie } = await criarSessao(perfil);
      expect((await request(app).get('/api/usuarios').set('Cookie', cookie)).status).toBe(403);
    }
  });
});

describe('criação de usuários', () => {
  it('cria solicitante com escola, sem devolver o hash, e ele consegue logar', async () => {
    const escola = await criarEscola();

    const resposta = await criar({
      nome: 'Maria Diretora',
      email: ' Maria@Escola.dev ',
      senha: 'senha-forte-1',
      perfil: 'SOLICITANTE',
      escolaId: escola.id,
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      nome: 'Maria Diretora',
      email: 'maria@escola.dev',
      perfil: 'SOLICITANTE',
      escola: { id: escola.id, nome: escola.nome },
      ativo: true,
    });
    expect(resposta.body).not.toHaveProperty('senhaHash');

    const noBanco = await prisma.usuario.findUnique({ where: { id: resposta.body.id } });
    expect(noBanco?.senhaHash).not.toBe('senha-forte-1');
    expect(await bcrypt.compare('senha-forte-1', noBanco?.senhaHash ?? '')).toBe(true);
    expect((await tentarLogin('maria@escola.dev', 'senha-forte-1')).status).toBe(200);
  });

  it('exige escola para solicitante e proíbe escola para técnico e admin', async () => {
    const escola = await criarEscola();
    const base = { nome: 'Fulano de Tal', senha: 'senha-forte-1' };

    const semEscola = await criar({ ...base, email: 'a@x.dev', perfil: 'SOLICITANTE' });
    const tecnicoComEscola = await criar({
      ...base,
      email: 'b@x.dev',
      perfil: 'TECNICO',
      escolaId: escola.id,
    });

    expect(semEscola.status).toBe(400);
    expect(semEscola.body.erros).toEqual({ escolaId: 'Selecione a escola do solicitante.' });
    expect(tecnicoComEscola.status).toBe(400);
    expect(tecnicoComEscola.body.erros).toEqual({
      escolaId: 'Técnicos e administradores não são vinculados a uma escola.',
    });
  });

  it('recusa escola inativa ou inexistente com 422 no campo escolaId', async () => {
    const inativa = await criarEscola({ ativo: false });

    for (const escolaId of [inativa.id, 9999]) {
      const resposta = await criar({
        nome: 'Fulano de Tal',
        email: `f${escolaId}@x.dev`,
        senha: 'senha-forte-1',
        perfil: 'SOLICITANTE',
        escolaId,
      });

      expect(resposta.status).toBe(422);
      expect(resposta.body.erros).toEqual({ escolaId: 'Escola não encontrada ou inativa.' });
    }
  });

  it('valida senha, e-mail e perfil', async () => {
    const resposta = await criar({
      nome: 'Fulano',
      email: 'nao-email',
      senha: '123',
      perfil: 'CHEFE',
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erros).toMatchObject({
      email: 'Informe um e-mail válido.',
      senha: 'A senha precisa ter pelo menos 8 caracteres.',
      perfil: 'Selecione um perfil válido.',
    });
  });

  it('responde 409 no campo email quando o e-mail já existe (sem diferenciar maiúsculas)', async () => {
    const base = { nome: 'Técnico Um', senha: 'senha-forte-1', perfil: 'TECNICO' };
    await criar({ ...base, email: 'tec@x.dev' });

    const repetido = await criar({ ...base, email: 'TEC@x.dev' });

    expect(repetido.status).toBe(409);
    expect(repetido.body.erros).toEqual({ email: 'Já existe um usuário com este e-mail.' });
  });
});

describe('listagem de usuários', () => {
  it('filtra por perfil e busca por nome ou e-mail, sem expor hashes', async () => {
    await criarUsuario('TECNICO');
    await criarUsuario('SOLICITANTE');

    const tecnicos = await request(app).get('/api/usuarios?perfil=TECNICO').set('Cookie', admin);
    const porEmail = await request(app).get('/api/usuarios?q=solicitante').set('Cookie', admin);

    expect(tecnicos.body.total).toBe(1);
    expect(tecnicos.body.dados[0].perfil).toBe('TECNICO');
    expect(porEmail.body.total).toBe(1);
    expect(porEmail.body.dados[0].perfil).toBe('SOLICITANTE');
    for (const usuario of tecnicos.body.dados) {
      expect(usuario).not.toHaveProperty('senhaHash');
    }
  });
});

describe('edição de usuários', () => {
  it('mantém a senha quando ela não é enviada e troca quando é', async () => {
    const tecnico = await criarUsuario('TECNICO');
    const dados = { nome: 'Novo Nome', email: tecnico.email, perfil: 'TECNICO' };

    const semSenha = await atualizar(tecnico.id, { ...dados, senha: '' });
    expect(semSenha.status).toBe(200);
    expect(semSenha.body.nome).toBe('Novo Nome');
    expect((await tentarLogin(tecnico.email, 'Senha@123')).status).toBe(200);

    await atualizar(tecnico.id, { ...dados, senha: 'nova-senha-123' });
    expect((await tentarLogin(tecnico.email, 'Senha@123')).status).toBe(401);
    expect((await tentarLogin(tecnico.email, 'nova-senha-123')).status).toBe(200);
  });

  it('não deixa o admin desativar a si mesmo nem mudar o próprio perfil', async () => {
    const eu = await prisma.usuario.findUniqueOrThrow({ where: { id: adminId } });
    const dados = { nome: eu.nome, email: eu.email, perfil: 'ADMIN' };

    const desativarPorPut = await atualizar(adminId, { ...dados, ativo: false });
    const desativarPorDelete = await request(app)
      .delete(`/api/usuarios/${adminId}`)
      .set('Cookie', admin);
    const mudarPerfil = await atualizar(adminId, { ...dados, perfil: 'TECNICO' });

    expect(desativarPorPut.status).toBe(422);
    expect(desativarPorDelete.status).toBe(422);
    expect(mudarPerfil.status).toBe(422);
    expect(mudarPerfil.body.erros).toEqual({
      perfil: 'Você não pode alterar o próprio perfil.',
    });
  });

  it('permite editar solicitante cuja escola foi desativada depois, sem trocar a escola', async () => {
    const solicitante = await criarUsuario('SOLICITANTE');
    await prisma.escola.update({
      where: { id: solicitante.escolaId ?? 0 },
      data: { ativo: false },
    });

    const resposta = await atualizar(solicitante.id, {
      nome: 'Nome Corrigido',
      email: solicitante.email,
      perfil: 'SOLICITANTE',
      escolaId: solicitante.escolaId,
    });

    expect(resposta.status).toBe(200);
  });

  it('responde 404 para usuário inexistente', async () => {
    const resposta = await atualizar(9999, {
      nome: 'Ninguém',
      email: 'ninguem@x.dev',
      perfil: 'TECNICO',
    });

    expect(resposta.status).toBe(404);
  });
});

describe('desativação de usuários', () => {
  it('desativa sem apagar e o usuário deixa de conseguir logar', async () => {
    const tecnico = await criarUsuario('TECNICO');

    const resposta = await request(app).delete(`/api/usuarios/${tecnico.id}`).set('Cookie', admin);

    expect(resposta.status).toBe(204);
    expect((await prisma.usuario.findUnique({ where: { id: tecnico.id } }))?.ativo).toBe(false);
    expect((await tentarLogin(tecnico.email, 'Senha@123')).status).toBe(401);
  });
});
