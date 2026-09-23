import { execSync } from 'node:child_process';

import { garantirBancoDeTeste, URL_BANCO_TESTE } from './banco-teste.js';

// Roda uma vez antes de todos os testes: cria o banco de teste (se não
// existir) e aplica as migrations.
export default function prepararBancoDeTeste() {
  garantirBancoDeTeste(URL_BANCO_TESTE);

  try {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: URL_BANCO_TESTE },
      stdio: 'pipe',
    });
  } catch (erro) {
    const saida = (erro as { stderr?: Buffer }).stderr?.toString() ?? '';
    throw new Error(
      `Falha ao preparar o banco de teste. O Postgres está rodando (docker compose up -d db)?\n${saida}`,
      { cause: erro },
    );
  }
}
