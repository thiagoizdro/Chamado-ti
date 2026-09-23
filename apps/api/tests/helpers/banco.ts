import bcrypt from 'bcrypt';

import type { Perfil } from '../../src/generated/prisma/enums.js';
import { env } from '../../src/lib/env.js';
import { prisma } from '../../src/lib/prisma.js';
import { garantirBancoDeTeste } from '../setup/banco-teste.js';

export const SENHA_TESTE = 'Senha@123';

// Hash com custo baixo: os testes não precisam da lentidão do custo 10.
const hashSenhaTeste = bcrypt.hashSync(SENHA_TESTE, 4);

export async function limparBanco() {
  garantirBancoDeTeste(env.DATABASE_URL);
  await prisma.$executeRaw`
    TRUNCATE TABLE historico_chamado, chamados, equipamentos, usuarios, categorias, escolas
    RESTART IDENTITY CASCADE
  `;
}

let contador = 0;

export async function criarUsuario(perfil: Perfil, dados: { ativo?: boolean } = {}) {
  contador++;
  const escola =
    perfil === 'SOLICITANTE'
      ? await prisma.escola.create({ data: { nome: `Escola de Teste ${contador}` } })
      : null;

  return prisma.usuario.create({
    data: {
      nome: `Usuário ${perfil} ${contador}`,
      email: `${perfil.toLowerCase()}${contador}@teste.dev`,
      senhaHash: hashSenhaTeste,
      perfil,
      escolaId: escola?.id ?? null,
      ativo: dados.ativo ?? true,
    },
  });
}

export function criarEscola(dados: { nome?: string; ativo?: boolean } = {}) {
  contador++;
  return prisma.escola.create({
    data: { nome: dados.nome ?? `Escola ${contador}`, ativo: dados.ativo ?? true },
  });
}
