import { existsSync } from 'node:fs';
import { defineConfig, env } from 'prisma/config';

// O Prisma 7 não carrega o .env sozinho. No host usamos o .env da raiz do
// monorepo; no Docker as variáveis já chegam pelo Compose.
const arquivoEnv = new URL('../../.env', import.meta.url);
if (existsSync(arquivoEnv)) {
  process.loadEnvFile(arquivoEnv);
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
