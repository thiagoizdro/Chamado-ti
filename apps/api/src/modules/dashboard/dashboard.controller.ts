import type { Request, Response } from 'express';

import type { FiltrosDashboard } from './dashboard.schemas.js';
import * as dashboardService from './dashboard.service.js';

export async function obter(req: Request, res: Response) {
  const filtros = req.query as unknown as FiltrosDashboard;
  res.json(await dashboardService.obterIndicadores(filtros));
}
