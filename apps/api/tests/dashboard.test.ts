import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import type { Prisma } from '../src/generated/prisma/client.js';
import { prisma } from '../src/lib/prisma.js';
import { criarEscola, criarUsuario, limparBanco } from './helpers/banco.js';
import { criarSessao } from './helpers/sessao.js';

let admin: string;
let escolaA: number;
let escolaB: number;
let impressora: number;
let rede: number;
let solicitanteId: number;

beforeEach(async () => {
  await limparBanco();
  ({ cookie: admin } = await criarSessao('ADMIN'));
  const solicitante = await criarUsuario('SOLICITANTE');
  solicitanteId = solicitante.id;
  escolaA = solicitante.escolaId ?? 0;
  ({ id: escolaB } = await criarEscola({ nome: 'Escola B' }));
  ({ id: impressora } = await prisma.categoria.create({ data: { nome: 'Impressora' } }));
  ({ id: rede } = await prisma.categoria.create({ data: { nome: 'Rede' } }));
});

function novoChamado(dados: Partial<Prisma.ChamadoUncheckedCreateInput> = {}) {
  return prisma.chamado.create({
    data: {
      titulo: 'Chamado',
      descricao: 'Descrição do problema.',
      escolaId: escolaA,
      categoriaId: impressora,
      solicitanteId,
      abertoEm: new Date('2026-09-10T10:00:00-03:00'),
      ...dados,
    },
  });
}

// Chamado resolvido que levou "horas" horas para fechar.
function resolvido(horas: number, dados: Partial<Prisma.ChamadoUncheckedCreateInput> = {}) {
  const abertoEm = new Date('2026-09-10T10:00:00-03:00');
  return novoChamado({
    status: 'RESOLVIDO',
    solucao: 'Resolvido.',
    abertoEm,
    resolvidoEm: new Date(abertoEm.getTime() + horas * 60 * 60 * 1000),
    ...dados,
  });
}

const dashboard = (query = '') => request(app).get(`/api/dashboard?${query}`).set('Cookie', admin);

describe('permissões', () => {
  it('libera só o admin', async () => {
    const { cookie: tecnico } = await criarSessao('TECNICO');
    const { cookie: solicitante } = await criarSessao('SOLICITANTE');

    expect((await request(app).get('/api/dashboard')).status).toBe(401);
    expect((await request(app).get('/api/dashboard').set('Cookie', tecnico)).status).toBe(403);
    expect((await request(app).get('/api/dashboard').set('Cookie', solicitante)).status).toBe(403);
    expect((await dashboard()).status).toBe(200);
  });
});

describe('indicadores', () => {
  it('conta por status, escola e categoria, incluindo quem tem zero', async () => {
    await novoChamado();
    await novoChamado({ status: 'EM_ATENDIMENTO', categoriaId: rede });
    await resolvido(2);

    const { body } = await dashboard();

    expect(body.total).toBe(3);
    expect(body.porStatus).toEqual({
      ABERTO: 1,
      EM_ATENDIMENTO: 1,
      AGUARDANDO_PECA: 0,
      RESOLVIDO: 1,
    });
    expect(
      body.porEscola.map((item: { id: number; total: number }) => [item.id, item.total]),
    ).toEqual([
      [escolaA, 3],
      [escolaB, 0],
    ]);
    expect(body.porCategoria).toEqual([
      { id: impressora, nome: 'Impressora', total: 2 },
      { id: rede, nome: 'Rede', total: 1 },
    ]);
  });

  it('ranqueia os equipamentos com mais chamados, com os dados da máquina', async () => {
    const [muito, pouco] = await Promise.all(
      ['PAT-1', 'PAT-2'].map((patrimonio) =>
        prisma.equipamento.create({
          data: { patrimonio, tipo: 'Impressora', modelo: 'M1', escolaId: escolaA },
        }),
      ),
    );
    await novoChamado({ equipamentoId: muito?.id });
    await novoChamado({ equipamentoId: muito?.id });
    await novoChamado({ equipamentoId: pouco?.id });
    await novoChamado(); // sem equipamento: não entra no ranking

    const { body } = await dashboard();

    expect(body.topEquipamentos).toEqual([
      {
        id: muito?.id,
        patrimonio: 'PAT-1',
        tipo: 'Impressora',
        modelo: 'M1',
        escola: { id: escolaA, nome: expect.any(String) },
        total: 2,
      },
      expect.objectContaining({ patrimonio: 'PAT-2', total: 1 }),
    ]);
  });

  it('calcula o tempo médio de resolução em horas só com os resolvidos', async () => {
    await resolvido(2);
    await resolvido(5);
    await novoChamado({ status: 'EM_ATENDIMENTO' });

    const { body } = await dashboard();

    expect(body.tempoMedioResolucao).toEqual({ horas: 3.5, chamadosResolvidos: 2 });
  });

  it('devolve tempo médio nulo quando não há resolvidos', async () => {
    await novoChamado();

    const { body } = await dashboard();

    expect(body.tempoMedioResolucao).toEqual({ horas: null, chamadosResolvidos: 0 });
  });
});

describe('filtros', () => {
  it('filtra contagens pela abertura e o tempo médio pela resolução', async () => {
    // Aberto em agosto, resolvido em setembro: conta no tempo médio de
    // setembro, mas não nas contagens de setembro.
    await resolvido(24 * 30, {
      abertoEm: new Date('2026-08-20T10:00:00-03:00'),
      resolvidoEm: new Date('2026-09-19T10:00:00-03:00'),
    });
    await novoChamado({ abertoEm: new Date('2026-09-05T10:00:00-03:00') });
    await novoChamado({ abertoEm: new Date('2026-10-05T10:00:00-03:00') });

    const { body } = await dashboard('de=2026-09-01&ate=2026-09-30');

    expect(body.total).toBe(1);
    expect(body.tempoMedioResolucao).toEqual({ horas: 720, chamadosResolvidos: 1 });
  });

  it('filtra por escola', async () => {
    await novoChamado();
    await resolvido(10, { escolaId: escolaB });

    const { body } = await dashboard(`escolaId=${escolaB}`);

    expect(body.total).toBe(1);
    expect(body.porEscola).toEqual([{ id: escolaB, nome: 'Escola B', total: 1 }]);
    expect(body.tempoMedioResolucao.horas).toBe(10);
  });

  it('recusa período invertido', async () => {
    const resposta = await dashboard('de=2026-09-30&ate=2026-09-01');

    expect(resposta.status).toBe(400);
    expect(resposta.body.erros).toHaveProperty('ate');
  });
});
