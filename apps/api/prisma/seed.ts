import { fakerPT_BR as faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

import { prisma } from '../src/lib/prisma.js';
import {
  CATEGORIAS,
  DIAS_DE_HISTORICO,
  DOMINIO_EMAIL,
  ESCOLAS,
  type NomeCategoria,
  QUANTIDADE_CHAMADOS,
  QUANTIDADE_EQUIPAMENTOS_PROBLEMATICOS,
  QUANTIDADE_TECNICOS,
  SENHA_PADRAO,
  TIPOS_EQUIPAMENTO,
} from './seed/dados.js';
import { type ContextoSimulacao, simularChamados } from './seed/simulacao.js';

// Semente fixa: o seed gera sempre os mesmos dados.
faker.seed(42);

const CUSTO_BCRYPT = 10;

async function limparBanco() {
  // RESTART IDENTITY faz os IDs recomeçarem do 1 a cada seed.
  await prisma.$executeRaw`
    TRUNCATE TABLE historico_chamado, chamados, equipamentos, usuarios, categorias, escolas
    RESTART IDENTITY CASCADE
  `;
}

async function criarCategorias() {
  await prisma.categoria.createMany({
    data: CATEGORIAS.map((nome) => ({ nome })),
  });
  return prisma.categoria.findMany({ orderBy: { id: 'asc' } });
}

async function criarUsuariosDaRede(senhaHash: string) {
  await prisma.usuario.create({
    data: {
      nome: faker.person.fullName(),
      email: `admin@${DOMINIO_EMAIL}`,
      senhaHash,
      perfil: 'ADMIN',
    },
  });

  for (let numero = 1; numero <= QUANTIDADE_TECNICOS; numero++) {
    await prisma.usuario.create({
      data: {
        nome: faker.person.fullName(),
        email: `tecnico${numero}@${DOMINIO_EMAIL}`,
        senhaHash,
        perfil: 'TECNICO',
      },
    });
  }

  return prisma.usuario.findMany({ where: { perfil: 'TECNICO' }, orderBy: { id: 'asc' } });
}

async function criarEscolasComSolicitantes(senhaHash: string) {
  const escolas = [];

  for (const { apelido, ...dadosEscola } of ESCOLAS) {
    const escola = await prisma.escola.create({
      data: {
        ...dadosEscola,
        usuarios: {
          create: {
            nome: faker.person.fullName(),
            email: `direcao.${apelido}@${DOMINIO_EMAIL}`,
            senhaHash,
            perfil: 'SOLICITANTE',
          },
        },
      },
      include: { usuarios: true },
    });
    escolas.push(escola);
  }

  return escolas;
}

function buscarSolicitanteDaEscola(usuarios: { id: number }[]): number {
  const [solicitante] = usuarios;
  if (!solicitante) {
    throw new Error('Escola criada sem solicitante');
  }
  return solicitante.id;
}

async function criarEquipamentos(escolaIds: number[]) {
  let proximoPatrimonio = 1;

  for (const escolaId of escolaIds) {
    for (const { tipo, quantidadePorEscola, modelos, localizacoes } of TIPOS_EQUIPAMENTO) {
      for (let i = 0; i < quantidadePorEscola; i++) {
        const { marca, modelo } = faker.helpers.arrayElement(modelos);
        await prisma.equipamento.create({
          data: {
            patrimonio: `PAT-${String(proximoPatrimonio++).padStart(6, '0')}`,
            tipo,
            marca,
            modelo,
            localizacao: faker.helpers.arrayElement(localizacoes),
            escolaId,
          },
        });
      }
    }
  }

  return prisma.equipamento.findMany({ orderBy: { id: 'asc' } });
}

async function criarChamados(contexto: ContextoSimulacao) {
  const chamados = simularChamados(faker, contexto, QUANTIDADE_CHAMADOS);

  // Em ordem de abertura: IDs menores são os chamados mais antigos.
  for (const { historico, ...chamado } of chamados) {
    await prisma.chamado.create({
      data: { ...chamado, historico: { createMany: { data: historico } } },
    });
  }

  return chamados;
}

async function main() {
  // Data de referência única: nenhum evento do seed fica depois dela.
  const agora = new Date();

  await limparBanco();

  const senhaHash = await bcrypt.hash(SENHA_PADRAO, CUSTO_BCRYPT);

  const categorias = await criarCategorias();
  const tecnicos = await criarUsuariosDaRede(senhaHash);
  const escolas = await criarEscolasComSolicitantes(senhaHash);
  const equipamentos = await criarEquipamentos(escolas.map((escola) => escola.id));

  const problematicos = new Set(
    faker.helpers
      .arrayElements(equipamentos, QUANTIDADE_EQUIPAMENTOS_PROBLEMATICOS)
      .map((equipamento) => equipamento.id),
  );

  const chamados = await criarChamados({
    agora,
    diasDeHistorico: DIAS_DE_HISTORICO,
    escolas: escolas.map((escola) => ({
      id: escola.id,
      solicitanteId: buscarSolicitanteDaEscola(escola.usuarios),
    })),
    equipamentos: equipamentos.map(({ id, escolaId, tipo }) => ({
      id,
      escolaId,
      tipo,
      problematico: problematicos.has(id),
    })),
    categoriaIdPorNome: Object.fromEntries(
      categorias.map((categoria) => [categoria.nome, categoria.id]),
    ) as Record<NomeCategoria, number>,
    tecnicoIds: tecnicos.map((tecnico) => tecnico.id),
  });

  console.log('Seed concluído:');
  console.log(`  ${categorias.length} categorias`);
  console.log(`  ${escolas.length} escolas`);
  console.log(`  ${tecnicos.length} técnicos, 1 admin e ${escolas.length} solicitantes`);
  console.log(`  ${equipamentos.length} equipamentos`);
  console.log(
    `  ${chamados.length} chamados com ${chamados.reduce((total, c) => total + c.historico.length, 0)} registros de histórico`,
  );
}

main()
  .catch((erro: unknown) => {
    console.error('Falha no seed:', erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
