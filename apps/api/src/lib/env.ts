import { z } from 'zod';

// Valida as variáveis de ambiente na inicialização: se faltar algo, a API
// nem sobe, em vez de falhar depois no meio de uma requisição.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.url(),
  CORS_ORIGIN: z.url().default('http://localhost:5173'),
});

export const env = envSchema.parse(process.env);
