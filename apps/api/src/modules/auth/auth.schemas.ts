import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ error: 'Informe o e-mail.' })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: 'Informe um e-mail válido.' })),
  senha: z.string({ error: 'Informe a senha.' }).min(1, 'Informe a senha.'),
});

export type LoginDados = z.infer<typeof loginSchema>;
