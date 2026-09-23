import type { Faker } from '@faker-js/faker';

import type { AcaoHistorico, Prioridade, StatusChamado } from '../../src/generated/prisma/enums.js';
import { podeTransitar } from '../../src/modules/chamados/status.js';
import type { NomeCategoria } from './dados.js';
import {
  CATEGORIAS_POR_TIPO,
  CATEGORIAS_SEM_EQUIPAMENTO,
  COMENTARIOS_TECNICO,
  PROBLEMAS_POR_CATEGORIA,
} from './modelos-chamado.js';

// Simula chamados percorrendo a máquina de estados em ordem cronológica.
// É uma função pura (não acessa o banco) para poder ser testada isoladamente.

export type EventoSimulado = {
  usuarioId: number;
  acao: AcaoHistorico;
  statusAnterior: StatusChamado | null;
  statusNovo: StatusChamado | null;
  descricao: string | null;
  criadoEm: Date;
};

export type ChamadoSimulado = {
  titulo: string;
  descricao: string;
  prioridade: Prioridade;
  status: StatusChamado;
  solucao: string | null;
  escolaId: number;
  equipamentoId: number | null;
  categoriaId: number;
  solicitanteId: number;
  tecnicoId: number | null;
  abertoEm: Date;
  resolvidoEm: Date | null;
  atualizadoEm: Date;
  historico: EventoSimulado[];
};

export type ContextoSimulacao = {
  agora: Date;
  diasDeHistorico: number;
  escolas: { id: number; solicitanteId: number }[];
  equipamentos: { id: number; escolaId: number; tipo: string; problematico: boolean }[];
  categoriaIdPorNome: Record<NomeCategoria, number>;
  tecnicoIds: number[];
};

type IntervaloHoras = [min: number, max: number];

// Status em que um chamado recente pode ficar parado (null = segue até RESOLVIDO).
type StatusPendente = Exclude<StatusChamado, 'RESOLVIDO'>;

const HORA_EM_MS = 60 * 60 * 1000;
const DIA_EM_MS = 24 * HORA_EM_MS;

// Quanto maior a prioridade, mais rápido o chamado é assumido e resolvido.
const PRAZO_PARA_ASSUMIR: Record<Prioridade, IntervaloHoras> = {
  CRITICA: [0.2, 2],
  ALTA: [0.5, 8],
  MEDIA: [1, 24],
  BAIXA: [4, 72],
};

const PRAZO_PARA_RESOLVER: Record<Prioridade, IntervaloHoras> = {
  CRITICA: [1, 8],
  ALTA: [2, 24],
  MEDIA: [4, 72],
  BAIXA: [8, 120],
};

const PRAZO_PARA_COMENTAR: IntervaloHoras = [0.5, 24];
const PRAZO_PARA_PEDIR_PECA: IntervaloHoras = [1, 8];
const PRAZO_PARA_CHEGAR_PECA: IntervaloHoras = [2 * 24, 15 * 24];

const CHANCE_COMENTARIO = 0.4;
const CHANCE_AGUARDAR_PECA = 0.25;
const CHANCE_TER_EQUIPAMENTO = 0.8;
const PESO_EQUIPAMENTO_PROBLEMATICO = 6;

// Parte dos chamados é aberta nas últimas semanas e fica pendente, para
// existir fila de atendimento (sem isso quase tudo estaria resolvido).
const DIAS_RECENTES = 21;
const CHANCE_ABERTURA_RECENTE = 0.2;
const CHANCE_RECENTE_PENDENTE = 0.6;
const MAX_DIAS_SEM_TECNICO = 5;

// Horário escolar (7h às 17h de Brasília) convertido para UTC (UTC-3).
const HORA_UTC_INICIO_EXPEDIENTE = 10;
const HORA_UTC_FIM_EXPEDIENTE = 20;

export function simularChamados(
  faker: Faker,
  contexto: ContextoSimulacao,
  quantidade: number,
): ChamadoSimulado[] {
  return Array.from({ length: quantidade }, () => simularChamado(faker, contexto)).sort(
    (a, b) => a.abertoEm.getTime() - b.abertoEm.getTime(),
  );
}

function simularChamado(faker: Faker, contexto: ContextoSimulacao): ChamadoSimulado {
  const { escolaId, equipamentoId, categoria } = sortearOrigem(faker, contexto);
  const problema = faker.helpers.arrayElement(PROBLEMAS_POR_CATEGORIA[categoria]);
  // A solução é decidida no início: ela define se o chamado pode esperar peça.
  const solucao = faker.helpers.arrayElement(problema.solucoes);
  const prioridade = sortearPrioridade(faker);
  const solicitanteId = buscarSolicitante(contexto, escolaId);
  const abertoEm = sortearAbertura(faker, contexto);
  const parada = sortearParada(faker, contexto, abertoEm, solucao.peca !== undefined);

  const chamado: ChamadoSimulado = {
    titulo: problema.titulo,
    descricao: problema.descricao,
    prioridade,
    status: 'ABERTO',
    solucao: null,
    escolaId,
    equipamentoId,
    categoriaId: contexto.categoriaIdPorNome[categoria],
    solicitanteId,
    tecnicoId: null,
    abertoEm,
    resolvidoEm: null,
    atualizadoEm: abertoEm,
    historico: [],
  };

  let instante = abertoEm;

  function registrar(evento: Omit<EventoSimulado, 'criadoEm'>) {
    chamado.historico.push({ ...evento, criadoEm: instante });
    chamado.atualizadoEm = instante;
  }

  function mudarStatus(novo: StatusChamado, usuarioId: number, descricao: string | null = null) {
    if (!podeTransitar(chamado.status, novo)) {
      throw new Error(`Transição inválida na simulação: ${chamado.status} → ${novo}`);
    }
    registrar({
      usuarioId,
      acao: 'STATUS_ALTERADO',
      statusAnterior: chamado.status,
      statusNovo: novo,
      descricao,
    });
    chamado.status = novo;
  }

  // Avança o relógio do chamado (sempre para dentro do expediente). Se o
  // próximo evento cairia no futuro, devolve false e o chamado fica parado
  // no status atual.
  function avancar([min, max]: IntervaloHoras): boolean {
    const proximo = ajustarParaExpediente(
      faker,
      new Date(instante.getTime() + faker.number.float({ min, max }) * HORA_EM_MS),
    );
    if (proximo > contexto.agora) {
      return false;
    }
    instante = proximo;
    return true;
  }

  registrar({
    usuarioId: solicitanteId,
    acao: 'CRIADO',
    statusAnterior: null,
    statusNovo: 'ABERTO',
    descricao: null,
  });

  if (parada === 'ABERTO' || !avancar(PRAZO_PARA_ASSUMIR[prioridade])) return chamado;
  const tecnicoId = faker.helpers.arrayElement(contexto.tecnicoIds);
  chamado.tecnicoId = tecnicoId;
  registrar({
    usuarioId: tecnicoId,
    acao: 'ATRIBUIDO',
    statusAnterior: null,
    statusNovo: null,
    descricao: null,
  });
  mudarStatus('EM_ATENDIMENTO', tecnicoId);

  if (faker.datatype.boolean({ probability: CHANCE_COMENTARIO })) {
    if (!avancar(PRAZO_PARA_COMENTAR)) return chamado;
    registrar({
      usuarioId: tecnicoId,
      acao: 'COMENTARIO',
      statusAnterior: null,
      statusNovo: null,
      descricao: faker.helpers.arrayElement(COMENTARIOS_TECNICO),
    });
  }

  if (parada === 'EM_ATENDIMENTO') return chamado;

  const { peca } = solucao;
  const vaiAguardarPeca =
    peca !== undefined &&
    (parada === 'AGUARDANDO_PECA' || faker.datatype.boolean({ probability: CHANCE_AGUARDAR_PECA }));

  if (vaiAguardarPeca) {
    if (!avancar(PRAZO_PARA_PEDIR_PECA)) return chamado;
    mudarStatus('AGUARDANDO_PECA', tecnicoId, `Aguardando ${peca}.`);
    if (parada === 'AGUARDANDO_PECA' || !avancar(PRAZO_PARA_CHEGAR_PECA)) return chamado;
    mudarStatus('EM_ATENDIMENTO', tecnicoId, `Peça recebida: ${peca}.`);
  }

  if (!avancar(PRAZO_PARA_RESOLVER[prioridade])) return chamado;
  mudarStatus('RESOLVIDO', tecnicoId);
  registrar({
    usuarioId: tecnicoId,
    acao: 'SOLUCAO_REGISTRADA',
    statusAnterior: null,
    statusNovo: null,
    descricao: solucao.texto,
  });
  chamado.solucao = solucao.texto;
  chamado.resolvidoEm = instante;

  return chamado;
}

function sortearOrigem(faker: Faker, contexto: ContextoSimulacao) {
  if (faker.datatype.boolean({ probability: CHANCE_TER_EQUIPAMENTO })) {
    const equipamento = faker.helpers.weightedArrayElement(
      contexto.equipamentos.map((equipamento) => ({
        weight: equipamento.problematico ? PESO_EQUIPAMENTO_PROBLEMATICO : 1,
        value: equipamento,
      })),
    );
    const categorias = CATEGORIAS_POR_TIPO[equipamento.tipo] ?? ['Outros'];
    return {
      escolaId: equipamento.escolaId,
      equipamentoId: equipamento.id,
      categoria: faker.helpers.arrayElement(categorias),
    };
  }

  return {
    escolaId: faker.helpers.arrayElement(contexto.escolas).id,
    equipamentoId: null,
    categoria: faker.helpers.arrayElement(CATEGORIAS_SEM_EQUIPAMENTO),
  };
}

function sortearPrioridade(faker: Faker): Prioridade {
  return faker.helpers.weightedArrayElement<Prioridade>([
    { weight: 20, value: 'BAIXA' },
    { weight: 45, value: 'MEDIA' },
    { weight: 25, value: 'ALTA' },
    { weight: 10, value: 'CRITICA' },
  ]);
}

function buscarSolicitante(contexto: ContextoSimulacao, escolaId: number): number {
  const escola = contexto.escolas.find((escola) => escola.id === escolaId);
  if (!escola) {
    throw new Error(`Escola ${escolaId} não encontrada no contexto da simulação`);
  }
  return escola.solicitanteId;
}

// Decide se um chamado recente fica parado antes de ser resolvido.
function sortearParada(
  faker: Faker,
  contexto: ContextoSimulacao,
  abertoEm: Date,
  podeAguardarPeca: boolean,
): StatusPendente | null {
  const diasDesdeAbertura = (contexto.agora.getTime() - abertoEm.getTime()) / DIA_EM_MS;
  if (diasDesdeAbertura > DIAS_RECENTES) return null;
  if (!faker.datatype.boolean({ probability: CHANCE_RECENTE_PENDENTE })) return null;

  const opcoes: { weight: number; value: StatusPendente }[] = [
    { weight: 40, value: 'EM_ATENDIMENTO' },
  ];
  // Chamado antigo sem técnico não é realista: só fica ABERTO se for recente.
  if (diasDesdeAbertura <= MAX_DIAS_SEM_TECNICO) opcoes.push({ weight: 35, value: 'ABERTO' });
  if (podeAguardarPeca) opcoes.push({ weight: 25, value: 'AGUARDANDO_PECA' });

  return faker.helpers.weightedArrayElement(opcoes);
}

function ehFimDeSemana(data: Date) {
  const diaDaSemana = data.getUTCDay();
  return diaDaSemana === 0 || diaDaSemana === 6;
}

// A equipe técnica só trabalha em dia útil, no horário escolar: um evento que
// cairia fora disso é empurrado para o próximo início de expediente.
function ajustarParaExpediente(faker: Faker, data: Date): Date {
  const ajustada = new Date(data);
  const irParaInicioDoExpediente = () =>
    ajustada.setUTCHours(HORA_UTC_INICIO_EXPEDIENTE, faker.number.int({ min: 0, max: 59 }), 0, 0);

  for (;;) {
    if (ehFimDeSemana(ajustada) || ajustada.getUTCHours() >= HORA_UTC_FIM_EXPEDIENTE) {
      ajustada.setUTCDate(ajustada.getUTCDate() + 1);
      irParaInicioDoExpediente();
    } else if (ajustada.getUTCHours() < HORA_UTC_INICIO_EXPEDIENTE) {
      irParaInicioDoExpediente();
    } else {
      return ajustada;
    }
  }
}

// Sorteia a abertura num dia útil, em horário escolar, dentro do período.
function sortearAbertura(faker: Faker, contexto: ContextoSimulacao): Date {
  const dias = faker.datatype.boolean({ probability: CHANCE_ABERTURA_RECENTE })
    ? DIAS_RECENTES
    : contexto.diasDeHistorico;
  const inicio = new Date(contexto.agora.getTime() - dias * DIA_EM_MS);

  for (;;) {
    const data = faker.date.between({ from: inicio, to: contexto.agora });
    if (ehFimDeSemana(data)) continue;

    data.setUTCHours(
      faker.number.int({ min: HORA_UTC_INICIO_EXPEDIENTE, max: HORA_UTC_FIM_EXPEDIENTE - 1 }),
      faker.number.int({ min: 0, max: 59 }),
      0,
      0,
    );
    if (data >= inicio && data <= contexto.agora) return data;
  }
}
