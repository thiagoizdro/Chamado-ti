import { z } from 'zod';

import { camposPeriodo, erroPeriodo, periodoValido } from '../../lib/periodo.js';

export const filtrosDashboardSchema = z
  .object({
    ...camposPeriodo,
    escolaId: z.coerce.number().int().positive().optional(),
  })
  .refine(periodoValido, erroPeriodo);

export type FiltrosDashboard = z.infer<typeof filtrosDashboardSchema>;
