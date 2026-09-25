import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../src/app.js';
import type { StatusChamado } from '../src/generated/prisma/enums.js';
import { prisma } from '../src/lib/prisma.js';
import { podeTransitar, TRANSICOES_STATUS } from '../src/modules/chamados/status.js';
import { criarEscola, criarUsuario, limparBanco } from './helpers/banco.js';
import { criarSessao, logar } from './helpers/sessao.js';

type Usuario = Awaited<ReturnType<typeof criarUsuario>>;

let solicitante: Usuario;
let cookieSolicitante: string;
let tecnico: Usuario;
let cookieTecnico: string;
let escolaId: number;
let categoriaId: number;

beforeEach(async () => {
  await limparBanco();
  solicitante = await criarUsuario('SOLICITANTE');
  cookieSolicitante = await logar(solicitante.email);
  ({ usuario: tecnico, cookie: cookieTecnico } = await criarSessao('TECNICO'));
  escolaId = solicitante.escolaId ?? 0;
  ({ id: categoriaId } = await prisma.categoria.create({ data: { nome: 'Impressora' } }));
});

const dadosChamado = (extras: Record<string, unknown> = {}) => ({
  titulo: 'Impressora não liga',
  descricao: 'A impressora da secretaria não liga desde ontem.',
  categoriaId,
  ...extras,
});

async function abrirChamado(cookie = cookieSolicitante, extras: Record<string, unknown> = {}) {
  const resposta = await request(app)
    .post('/api/chamados')
    .set('Cookie', cookie)
    .send(dadosChamado(extras));
  expect(resposta.status).toBe(201);
  return resposta.body as { id: number };
}

function assumir(id: number, cookie = cookieTecnico) {
  return request(app).patch(`/api/chamados/${id}/assumir`).set('Cookie', cookie);
}

function mudarStatus(id: number, corpo: Record<string, unknown>, cookie = cookieTecnico) {
  return request(app).patch(`/api/chamados/${id}/status`).set('Cookie', cookie).send(corpo);
}

const acoesDoHistorico = (chamadoId: number) =>
  prisma.historicoChamado
    .findMany({ where: { chamadoId }, orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }] })
    .then((registros) => registros.map((registro) => registro.acao));

describe('máquina de estados', () => {
  const todos = Object.keys(TRANSICOES_STATUS) as StatusChamado[];

  it('permite só as transições previstas', () => {
    const permitidas = todos.flatMap((de) =>
      todos.filter((para) => podeTransitar(de, para)).map((para) => `${de}→${para}`),
    );
    expect(permitidas.sort()).toEqual(
      [
        'ABERTO→EM_ATENDIMENTO',
        'AGUARDANDO_PECA→EM_ATENDIMENTO',
        'EM_ATENDIMENTO→AGUARDANDO_PECA',
        'EM_ATENDIMENTO→RESOLVIDO',
      ].sort(),
    );
  });

  it('percorre o fluxo completo até resolver e grava tudo no histórico', async () => {
    const { id } = await abrirChamado();

    expect((await assumir(id)).body.status).toBe('EM_ATENDIMENTO');
    expect((await mudarStatus(id, { status: 'AGUARDANDO_PECA', observacao: 'Fonte' })).status).toBe(
      200,
    );
    expect((await mudarStatus(id, { status: 'EM_ATENDIMENTO' })).status).toBe(200);
    const resolvido = await mudarStatus(id, { status: 'RESOLVIDO', solucao: 'Troquei a fonte.' });

    expect(resolvido.status).toBe(200);
    expect(resolvido.body).toMatchObject({
      status: 'RESOLVIDO',
      solucao: 'Troquei a fonte.',
      tecnico: { id: tecnico.id },
    });
    expect(new Date(resolvido.body.resolvidoEm).getTime()).toBeGreaterThanOrEqual(
      new Date(resolvido.body.abertoEm).getTime(),
    );
    expect(await acoesDoHistorico(id)).toEqual([
      'CRIADO',
      'ATRIBUIDO',
      'STATUS_ALTERADO',
      'STATUS_ALTERADO',
      'STATUS_ALTERADO',
      'STATUS_ALTERADO',
      'SOLUCAO_REGISTRADA',
    ]);
    const ultimo = resolvido.body.historico.at(-1);
    expect(ultimo).toMatchObject({
      acao: 'SOLUCAO_REGISTRADA',
      descricao: 'Troquei a fonte.',
      usuario: { id: tecnico.id, nome: tecnico.nome },
    });
  });

  it('recusa transição inválida com 422', async () => {
    const { id } = await abrirChamado();
    await assumir(id);
    await mudarStatus(id, { status: 'RESOLVIDO', solucao: 'Resolvido.' });

    const resposta = await mudarStatus(id, { status: 'EM_ATENDIMENTO' });

    expect(resposta.status).toBe(422);
    expect(resposta.body.mensagem).toBe(
      'Não é possível mudar o status de "Resolvido" para "Em atendimento".',
    );
  });

  it('exige assumir antes de mudar o status de um chamado aberto', async () => {
    const { id } = await abrirChamado();

    const resposta = await mudarStatus(id, { status: 'EM_ATENDIMENTO' });

    expect(resposta.status).toBe(422);
    expect(resposta.body.mensagem).toBe('Assuma o chamado antes de mudar o status.');
  });

  it('exige solução para resolver', async () => {
    const { id } = await abrirChamado();
    await assumir(id);

    const resposta = await mudarStatus(id, { status: 'RESOLVIDO', solucao: '   ' });

    expect(resposta.status).toBe(422);
    expect(resposta.body.erros).toEqual({ solucao: 'Descreva a solução para resolver o chamado.' });
  });

  it('não deixa o solicitante mudar status nem assumir', async () => {
    const { id } = await abrirChamado();

    expect((await assumir(id, cookieSolicitante)).status).toBe(403);
    expect((await mudarStatus(id, { status: 'EM_ATENDIMENTO' }, cookieSolicitante)).status).toBe(
      403,
    );
  });
});

describe('assumir', () => {
  it('define o técnico e grava ATRIBUIDO + STATUS_ALTERADO', async () => {
    const { id } = await abrirChamado();

    const resposta = await assumir(id);

    expect(resposta.status).toBe(200);
    expect(resposta.body.tecnico).toEqual({ id: tecnico.id, nome: tecnico.nome });
    expect(await acoesDoHistorico(id)).toEqual(['CRIADO', 'ATRIBUIDO', 'STATUS_ALTERADO']);
  });

  it('responde 409 quando o chamado já foi assumido', async () => {
    const { id } = await abrirChamado();
    const { cookie: outroTecnico } = await criarSessao('TECNICO');
    await assumir(id);

    const resposta = await assumir(id, outroTecnico);

    expect(resposta.status).toBe(409);
    expect(await acoesDoHistorico(id)).toEqual(['CRIADO', 'ATRIBUIDO', 'STATUS_ALTERADO']);
  });

  it('só um de dois técnicos simultâneos consegue assumir', async () => {
    const { id } = await abrirChamado();
    const { cookie: outroTecnico } = await criarSessao('TECNICO');

    const respostas = await Promise.all([assumir(id), assumir(id, outroTecnico)]);

    expect(respostas.map((resposta) => resposta.status).sort()).toEqual([200, 409]);
    expect(await acoesDoHistorico(id)).toEqual(['CRIADO', 'ATRIBUIDO', 'STATUS_ALTERADO']);
  });
});

describe('transação do histórico', () => {
  // Trigger temporário que faz o insert do histórico falhar no banco. Se a
  // mudança de status não estivesse na mesma transação, ela ficaria gravada.
  async function fazerHistoricoFalhar() {
    await prisma.$executeRawUnsafe(`
      CREATE FUNCTION falhar_historico() RETURNS trigger AS $$
      BEGIN RAISE EXCEPTION 'falha simulada'; END; $$ LANGUAGE plpgsql
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER falhar_historico BEFORE INSERT ON historico_chamado
      FOR EACH ROW EXECUTE FUNCTION falhar_historico()
    `);
  }

  afterEach(async () => {
    await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS falhar_historico ON historico_chamado');
    await prisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS falhar_historico');
  });

  it('desfaz a mudança de status se a gravação do histórico falhar', async () => {
    const { id } = await abrirChamado();
    await assumir(id);
    await fazerHistoricoFalhar();
    const erroNoConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const resposta = await mudarStatus(id, { status: 'AGUARDANDO_PECA' });

    expect(resposta.status).toBe(500);
    const chamado = await prisma.chamado.findUniqueOrThrow({ where: { id } });
    expect(chamado.status).toBe('EM_ATENDIMENTO');
    erroNoConsole.mockRestore();
  });

  it('não cria o chamado se a gravação do histórico falhar', async () => {
    await fazerHistoricoFalhar();
    const erroNoConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const resposta = await request(app)
      .post('/api/chamados')
      .set('Cookie', cookieSolicitante)
      .send(dadosChamado());

    expect(resposta.status).toBe(500);
    expect(await prisma.chamado.count()).toBe(0);
    erroNoConsole.mockRestore();
  });
});

describe('abertura', () => {
  it('usa sempre a escola do solicitante e grava CRIADO', async () => {
    const outraEscola = await criarEscola();

    const chamado = await abrirChamado(cookieSolicitante, { escolaId: outraEscola.id });

    const salvo = await prisma.chamado.findUniqueOrThrow({ where: { id: chamado.id } });
    expect(salvo).toMatchObject({
      escolaId,
      solicitanteId: solicitante.id,
      status: 'ABERTO',
      prioridade: 'MEDIA',
      tecnicoId: null,
    });
    expect(await acoesDoHistorico(chamado.id)).toEqual(['CRIADO']);
  });

  it('recusa equipamento de outra escola', async () => {
    const outraEscola = await criarEscola();
    const equipamento = await prisma.equipamento.create({
      data: { patrimonio: 'PAT-1', tipo: 'Impressora', escolaId: outraEscola.id },
    });

    const resposta = await request(app)
      .post('/api/chamados')
      .set('Cookie', cookieSolicitante)
      .send(dadosChamado({ equipamentoId: equipamento.id }));

    expect(resposta.status).toBe(422);
    expect(resposta.body.erros).toHaveProperty('equipamentoId');
    expect(await prisma.chamado.count()).toBe(0);
  });

  it('exige escola quando quem abre é admin', async () => {
    const { cookie: admin } = await criarSessao('ADMIN');

    const resposta = await request(app)
      .post('/api/chamados')
      .set('Cookie', admin)
      .send(dadosChamado());

    expect(resposta.status).toBe(422);
    expect(resposta.body.erros).toEqual({ escolaId: 'Selecione a escola.' });
  });

  it('não deixa o técnico abrir chamado', async () => {
    const resposta = await request(app)
      .post('/api/chamados')
      .set('Cookie', cookieTecnico)
      .send(dadosChamado({ escolaId }));

    expect(resposta.status).toBe(403);
  });

  it('valida os campos obrigatórios', async () => {
    const resposta = await request(app)
      .post('/api/chamados')
      .set('Cookie', cookieSolicitante)
      .send({ titulo: 'Oi' });

    expect(resposta.status).toBe(400);
    expect(Object.keys(resposta.body.erros).sort()).toEqual(['categoriaId', 'descricao', 'titulo']);
  });
});

describe('escopo do solicitante', () => {
  it('lista só os chamados da escola dele', async () => {
    const outro = await criarUsuario('SOLICITANTE');
    await abrirChamado();
    await abrirChamado(await logar(outro.email));

    const doSolicitante = await request(app).get('/api/chamados').set('Cookie', cookieSolicitante);
    const doTecnico = await request(app).get('/api/chamados').set('Cookie', cookieTecnico);

    expect(doSolicitante.body.total).toBe(1);
    expect(doSolicitante.body.dados[0].escola.id).toBe(escolaId);
    expect(doTecnico.body.total).toBe(2);
  });

  it('responde 404 (e não 403) para chamado de outra escola, inclusive ao comentar', async () => {
    const outro = await criarUsuario('SOLICITANTE');
    const { id } = await abrirChamado(await logar(outro.email));

    const detalhe = await request(app).get(`/api/chamados/${id}`).set('Cookie', cookieSolicitante);
    const comentario = await request(app)
      .post(`/api/chamados/${id}/comentarios`)
      .set('Cookie', cookieSolicitante)
      .send({ texto: 'Olá' });

    expect(detalhe.status).toBe(404);
    expect(comentario.status).toBe(404);
    expect(await acoesDoHistorico(id)).toEqual(['CRIADO']);
  });
});

describe('listagem', () => {
  it('filtra por técnico e vários status', async () => {
    const primeiro = await abrirChamado();
    await abrirChamado();
    await assumir(primeiro.id);

    const resposta = await request(app)
      .get(`/api/chamados?tecnicoId=${tecnico.id}&status=EM_ATENDIMENTO,AGUARDANDO_PECA`)
      .set('Cookie', cookieTecnico);

    expect(resposta.body.total).toBe(1);
    expect(resposta.body.dados[0].id).toBe(primeiro.id);
  });

  it('ordena por prioridade na ordem de fila', async () => {
    const baixa = await abrirChamado(cookieSolicitante, { prioridade: 'BAIXA' });
    const critica = await abrirChamado(cookieSolicitante, { prioridade: 'CRITICA' });

    const resposta = await request(app)
      .get('/api/chamados?ordem=prioridade')
      .set('Cookie', cookieTecnico);

    expect(resposta.body.dados.map((chamado: { id: number }) => chamado.id)).toEqual([
      critica.id,
      baixa.id,
    ]);
  });
});

describe('comentários', () => {
  it('grava o comentário no histórico com o autor', async () => {
    const { id } = await abrirChamado();

    const resposta = await request(app)
      .post(`/api/chamados/${id}/comentarios`)
      .set('Cookie', cookieSolicitante)
      .send({ texto: 'A impressora fica na sala 3.' });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      acao: 'COMENTARIO',
      descricao: 'A impressora fica na sala 3.',
      usuario: { id: solicitante.id },
    });
  });

  it('recusa comentário em chamado resolvido', async () => {
    const { id } = await abrirChamado();
    await assumir(id);
    await mudarStatus(id, { status: 'RESOLVIDO', solucao: 'Resolvido.' });

    const resposta = await request(app)
      .post(`/api/chamados/${id}/comentarios`)
      .set('Cookie', cookieTecnico)
      .send({ texto: 'Mais uma coisa' });

    expect(resposta.status).toBe(422);
  });
});
