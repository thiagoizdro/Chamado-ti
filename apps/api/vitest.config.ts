import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      // Banco de teste separado do de desenvolvimento.
      DATABASE_URL:
        process.env.DATABASE_URL_TEST ??
        'postgresql://chamados:chamados@localhost:5432/chamados_ti_test',
    },
  },
});
