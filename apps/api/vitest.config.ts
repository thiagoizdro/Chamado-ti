import { defineConfig } from 'vitest/config';

import { URL_BANCO_TESTE } from './tests/setup/banco-teste.js';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globalSetup: ['tests/setup/global-setup.ts'],
    // Os arquivos de teste compartilham o mesmo banco: rodam um de cada vez.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'segredo-somente-para-testes-com-32-caracteres-ou-mais',
      DATABASE_URL: URL_BANCO_TESTE,
    },
  },
});
