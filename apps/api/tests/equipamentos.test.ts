import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { criarEscola, criarUsuario, limparBanco } from './helpers/banco.js';
import { criarSessao, logar } from './helpers/sessao.js';

let admin: string;

beforeEach(async () => {
  await limparBanco();
  ({ cookie: admin } = await criarSessao('ADMIN'));
});

function criarEquipamento(dados: Record<string, unknown>) {
  return request(app).post('/api/equipamentos').set('Cookie', admin).send(dados);
}

async function novoEquipamento(escolaId: number, patrimonio: string, ativo = true) {
  return prisma.equipamento.create({
    data: { patrimonio, tipo: 'Impressora', escolaId, ativo },
  });
}

const patrimonios = (resposta: request.Response) =>
  resposta.body.dados.map((equipamento: { patrimonio: string }) => equipamento.patrimonio);

describe('listagem por perfil', () => {
  it('mostra ao solicitante só os equipamentos ativos da escola dele, ignorando filtros', async () => {
    const solicitante = await criarUsuario('SOLICITANTE');
    const outraEscola = await criarEscola();
    const escolaDele = solicitante.escolaId ?? 0;
    await novoEquipamento(escolaDele, 'PAT-1');
    await novoEquipamento(escolaDele, 'PAT-2', false);
    await novoEquipamento(outraEscola.id, 'PAT-3');
    const cookie = await logar(solicitante.email);

    const resposta = await request(app)
      .get(`/api/equipamentos?escolaId=${outraEscola.id}&ativo=todos`)
      .set('Cookie', cookie);

    expect(resposta.status).toBe(200);
    expect(patrimonios(resposta)).toEqual(['PAT-1']);
  });

  it('mostra ao técnico os equipamentos de todas as escolas, com filtros', async () => {
    const escolaA = await criarEscola();
    const escolaB = await criarEscola();
    await novoEquipamento(escolaA.id, 'PAT-1');
    await novoEquipamento(escolaB.id, 'PAT-2');
    const { cookie } = await criarSessao('TECNICO');

    const todos = await request(app).get('/api/equipamentos').set('Cookie', cookie);
    const daEscolaB = await request(app)
      .get(`/api/equipamentos?escolaId=${escolaB.id}`)
      .set('Cookie', cookie);

    expect(patrimonios(todos)).toEqual(['PAT-1', 'PAT-2']);
    expect(patrimonios(daEscolaB)).toEqual(['PAT-2']);
    expect(todos.body.dados[0].escola).toEqual({ id: escolaA.id, nome: escolaA.nome });
  });

  it('busca por patrimônio, tipo, marca ou modelo', async () => {
    const escola = await criarEscola();
    await prisma.equipamento.create({
      data: { patrimonio: 'PAT-9', tipo: 'Projetor', marca: 'Epson', escolaId: escola.id },
    });
    await novoEquipamento(escola.id, 'PAT-10');

    const resposta = await request(app).get('/api/equipamentos?q=epson').set('Cookie', admin);

    expect(patrimonios(resposta)).toEqual(['PAT-9']);
  });
});

describe('detalhe e histórico de defeitos', () => {
  it('bloqueia o solicitante com 403 e libera técnico e admin', async () => {
    const escola = await criarEscola();
    const equipamento = await novoEquipamento(escola.id, 'PAT-1');
    const { cookie: solicitante } = await criarSessao('SOLICITANTE');
    const { cookie: tecnico } = await criarSessao('TECNICO');

    for (const caminho of [
      `/api/equipamentos/${equipamento.id}`,
      `/api/equipamentos/${equipamento.id}/chamados`,
    ]) {
      expect((await request(app).get(caminho).set('Cookie', solicitante)).status).toBe(403);
      expect((await request(app).get(caminho).set('Cookie', tecnico)).status).toBe(200);
      expect((await request(app).get(caminho).set('Cookie', admin)).status).toBe(200);
    }
  });

  it('lista os chamados da máquina do mais recente para o mais antigo', async () => {
    const solicitante = await criarUsuario('SOLICITANTE');
    const escolaId = solicitante.escolaId ?? 0;
    const categoria = await prisma.categoria.create({ data: { nome: 'Impressora' } });
    const equipamento = await novoEquipamento(escolaId, 'PAT-1');
    const outro = await novoEquipamento(escolaId, 'PAT-2');

    const base = {
      descricao: 'Descrição',
      escolaId,
      categoriaId: categoria.id,
      solicitanteId: solicitante.id,
    };
    await prisma.chamado.createMany({
      data: [
        {
          ...base,
          titulo: 'Antigo',
          equipamentoId: equipamento.id,
          abertoEm: new Date('2026-01-10'),
        },
        {
          ...base,
          titulo: 'Recente',
          equipamentoId: equipamento.id,
          abertoEm: new Date('2026-03-10'),
        },
        { ...base, titulo: 'De outra máquina', equipamentoId: outro.id },
      ],
    });

    const detalhe = await request(app)
      .get(`/api/equipamentos/${equipamento.id}`)
      .set('Cookie', admin);
    const chamados = await request(app)
      .get(`/api/equipamentos/${equipamento.id}/chamados`)
      .set('Cookie', admin);

    expect(detalhe.body._count.chamados).toBe(2);
    expect(chamados.body.total).toBe(2);
    expect(chamados.body.dados.map((c: { titulo: string }) => c.titulo)).toEqual([
      'Recente',
      'Antigo',
    ]);
    expect(chamados.body.dados[0].categoria).toEqual({ id: categoria.id, nome: 'Impressora' });
  });

  it('responde 404 para equipamento inexistente', async () => {
    expect(
      (await request(app).get('/api/equipamentos/999/chamados').set('Cookie', admin)).status,
    ).toBe(404);
  });
});

describe('cadastro de equipamentos', () => {
  it('só o admin cria', async () => {
    const escola = await criarEscola();
    const { cookie: tecnico } = await criarSessao('TECNICO');

    const resposta = await request(app)
      .post('/api/equipamentos')
      .set('Cookie', tecnico)
      .send({ patrimonio: 'PAT-1', tipo: 'Impressora', escolaId: escola.id });

    expect(resposta.status).toBe(403);
  });

  it('cria com patrimônio em maiúsculas e campos opcionais vazios como null', async () => {
    const escola = await criarEscola();

    const resposta = await criarEquipamento({
      patrimonio: ' pat-000500 ',
      tipo: 'Projetor',
      marca: 'Epson',
      modelo: '',
      localizacao: 'Sala 3',
      escolaId: escola.id,
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      patrimonio: 'PAT-000500',
      modelo: null,
      escola: { id: escola.id },
    });
  });

  it('responde 409 no campo patrimonio quando ele já existe', async () => {
    const escola = await criarEscola();
    await criarEquipamento({ patrimonio: 'PAT-1', tipo: 'Impressora', escolaId: escola.id });

    const repetido = await criarEquipamento({
      patrimonio: 'pat-1',
      tipo: 'Computador',
      escolaId: escola.id,
    });

    expect(repetido.status).toBe(409);
    expect(repetido.body.erros).toEqual({
      patrimonio: 'Já existe um equipamento com este patrimônio.',
    });
  });

  it('recusa escola inativa com 422 e exige escola', async () => {
    const inativa = await criarEscola({ ativo: false });

    const comInativa = await criarEquipamento({
      patrimonio: 'PAT-1',
      tipo: 'Impressora',
      escolaId: inativa.id,
    });
    const semEscola = await criarEquipamento({ patrimonio: 'PAT-2', tipo: 'Impressora' });

    expect(comInativa.status).toBe(422);
    expect(comInativa.body.erros).toEqual({ escolaId: 'Escola não encontrada ou inativa.' });
    expect(semEscola.status).toBe(400);
    expect(semEscola.body.erros).toEqual({ escolaId: 'Selecione a escola.' });
  });
});

describe('edição e desativação', () => {
  it('permite mudar de escola só enquanto o equipamento não tem chamados', async () => {
    const solicitante = await criarUsuario('SOLICITANTE');
    const escolaId = solicitante.escolaId ?? 0;
    const novaEscola = await criarEscola();
    const semChamados = await novoEquipamento(escolaId, 'PAT-1');
    const comChamados = await novoEquipamento(escolaId, 'PAT-2');
    const categoria = await prisma.categoria.create({ data: { nome: 'Impressora' } });
    await prisma.chamado.create({
      data: {
        titulo: 'Papel enroscando',
        descricao: 'Descrição',
        escolaId,
        equipamentoId: comChamados.id,
        categoriaId: categoria.id,
        solicitanteId: solicitante.id,
      },
    });
    const dados = { tipo: 'Impressora', escolaId: novaEscola.id };

    const moverLivre = await request(app)
      .put(`/api/equipamentos/${semChamados.id}`)
      .set('Cookie', admin)
      .send({ ...dados, patrimonio: 'PAT-1' });
    const moverComChamados = await request(app)
      .put(`/api/equipamentos/${comChamados.id}`)
      .set('Cookie', admin)
      .send({ ...dados, patrimonio: 'PAT-2' });
    const editarSemMover = await request(app)
      .put(`/api/equipamentos/${comChamados.id}`)
      .set('Cookie', admin)
      .send({ patrimonio: 'PAT-2', tipo: 'Multifuncional', escolaId });

    expect(moverLivre.status).toBe(200);
    expect(moverLivre.body.escolaId).toBe(novaEscola.id);
    expect(moverComChamados.status).toBe(422);
    expect(moverComChamados.body.erros).toEqual({
      escolaId: 'Este equipamento já tem chamados e não pode mudar de escola.',
    });
    expect(editarSemMover.status).toBe(200);
    expect(editarSemMover.body.tipo).toBe('Multifuncional');
  });

  it('desativa sem apagar e esconde da lista padrão', async () => {
    const escola = await criarEscola();
    const equipamento = await novoEquipamento(escola.id, 'PAT-1');

    const resposta = await request(app)
      .delete(`/api/equipamentos/${equipamento.id}`)
      .set('Cookie', admin);
    const lista = await request(app).get('/api/equipamentos').set('Cookie', admin);

    expect(resposta.status).toBe(204);
    expect((await prisma.equipamento.findUnique({ where: { id: equipamento.id } }))?.ativo).toBe(
      false,
    );
    expect(lista.body.total).toBe(0);
  });
});
