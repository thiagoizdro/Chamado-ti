import { base, Faker, pt_BR } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { CATEGORIAS, type NomeCategoria } from '../prisma/seed/dados.js';
import {
  type ChamadoSimulado,
  type ContextoSimulacao,
  simularChamados,
} from '../prisma/seed/simulacao.js';
import { podeTransitar } from '../src/modules/chamados/status.js';

const AGORA = new Date('2026-09-22T15:00:00Z');
const DIAS_DE_HISTORICO = 180;
const TIPOS = ['Computador', 'Notebook', 'Impressora', 'Projetor', 'Roteador', 'Telefone IP'];

function criarContexto(): ContextoSimulacao {
  const escolaIds = [1, 2, 3, 4, 5];
  return {
    agora: AGORA,
    diasDeHistorico: DIAS_DE_HISTORICO,
    escolas: escolaIds.map((id) => ({ id, solicitanteId: 100 + id })),
    equipamentos: escolaIds.flatMap((escolaId) =>
      TIPOS.map((tipo, indice) => ({
        id: escolaId * 10 + indice,
        escolaId,
        tipo,
        problematico: indice === 0,
      })),
    ),
    categoriaIdPorNome: Object.fromEntries(
      CATEGORIAS.map((nome, indice) => [nome, indice + 1]),
    ) as Record<NomeCategoria, number>,
    tecnicoIds: [2, 3, 4],
  };
}

function simular(semente: number, quantidade = 500): ChamadoSimulado[] {
  const faker = new Faker({ locale: [pt_BR, base] });
  faker.seed(semente);
  return simularChamados(faker, criarContexto(), quantidade);
}

describe('simulação de chamados do seed', () => {
  const contexto = criarContexto();
  const chamados = simular(42);

  it('abre todos os chamados dentro do período e nunca no futuro', () => {
    const inicio = AGORA.getTime() - DIAS_DE_HISTORICO * 24 * 60 * 60 * 1000;
    for (const chamado of chamados) {
      expect(chamado.abertoEm.getTime()).toBeGreaterThanOrEqual(inicio);
      expect(chamado.abertoEm.getTime()).toBeLessThanOrEqual(AGORA.getTime());
    }
  });

  it('começa o histórico com CRIADO pelo solicitante da escola', () => {
    for (const chamado of chamados) {
      const escola = contexto.escolas.find((escola) => escola.id === chamado.escolaId);
      const [primeiro] = chamado.historico;

      expect(chamado.solicitanteId).toBe(escola?.solicitanteId);
      expect(primeiro?.acao).toBe('CRIADO');
      expect(primeiro?.usuarioId).toBe(chamado.solicitanteId);
      expect(primeiro?.criadoEm).toEqual(chamado.abertoEm);
    }
  });

  it('mantém o histórico em ordem cronológica, sem eventos no futuro', () => {
    for (const chamado of chamados) {
      const instantes = chamado.historico.map((evento) => evento.criadoEm.getTime());

      expect(instantes).toEqual([...instantes].sort((a, b) => a - b));
      expect(Math.max(...instantes)).toBeLessThanOrEqual(AGORA.getTime());
      expect(chamado.atualizadoEm.getTime()).toBe(Math.max(...instantes));
    }
  });

  it('só faz transições permitidas pela máquina de estados', () => {
    for (const chamado of chamados) {
      let statusAtual = 'ABERTO' as ChamadoSimulado['status'];

      for (const evento of chamado.historico) {
        if (evento.acao !== 'STATUS_ALTERADO') continue;

        expect(evento.statusAnterior).toBe(statusAtual);
        expect(evento.statusNovo).not.toBeNull();
        if (!evento.statusAnterior || !evento.statusNovo) continue;
        expect(podeTransitar(evento.statusAnterior, evento.statusNovo)).toBe(true);
        statusAtual = evento.statusNovo;
      }

      expect(chamado.status).toBe(statusAtual);
    }
  });

  it('só deixa sem técnico os chamados ABERTOS', () => {
    for (const chamado of chamados) {
      if (chamado.status === 'ABERTO') {
        expect(chamado.tecnicoId).toBeNull();
      } else {
        expect(contexto.tecnicoIds).toContain(chamado.tecnicoId);
      }
    }
  });

  it('exige solução, técnico e resolvidoEm coerente nos RESOLVIDOS', () => {
    for (const chamado of chamados) {
      const registrouSolucao = chamado.historico.some(
        (evento) => evento.acao === 'SOLUCAO_REGISTRADA',
      );

      if (chamado.status === 'RESOLVIDO') {
        expect(chamado.solucao).toBeTruthy();
        expect(chamado.tecnicoId).not.toBeNull();
        expect(chamado.resolvidoEm).not.toBeNull();
        expect(chamado.resolvidoEm?.getTime()).toBeGreaterThan(chamado.abertoEm.getTime());
        expect(registrouSolucao).toBe(true);
      } else {
        expect(chamado.solucao).toBeNull();
        expect(chamado.resolvidoEm).toBeNull();
        expect(registrouSolucao).toBe(false);
      }
    }
  });

  it('usa equipamento da mesma escola do chamado', () => {
    for (const chamado of chamados) {
      if (chamado.equipamentoId === null) continue;
      const equipamento = contexto.equipamentos.find((e) => e.id === chamado.equipamentoId);

      expect(equipamento?.escolaId).toBe(chamado.escolaId);
    }
  });

  it('gera chamados em todos os status, para existir fila de atendimento', () => {
    const status = new Set(chamados.map((chamado) => chamado.status));

    expect(status).toEqual(new Set(['ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_PECA', 'RESOLVIDO']));
  });

  it('gera sempre os mesmos dados para a mesma semente', () => {
    expect(simular(7, 50)).toEqual(simular(7, 50));
  });
});
