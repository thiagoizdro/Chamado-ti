import { z } from 'zod';

import { emailSchema } from '../../lib/schemas.js';

export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string({ error: 'Informe a senha.' }).min(1, 'Informe a senha.'),
});

export type LoginDados = z.infer<typeof loginSchema>;
