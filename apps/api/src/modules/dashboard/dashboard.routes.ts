import { Router } from 'express';

import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { validar } from '../../middlewares/validar.js';
import * as dashboardController from './dashboard.controller.js';
import { filtrosDashboardSchema } from './dashboard.schemas.js';

export const dashboardRoutes = Router();

// Indicadores da rede: só admin.
dashboardRoutes.get(
  '/',
  autenticar,
  autorizar('ADMIN'),
  validar({ query: filtrosDashboardSchema }),
  dashboardController.obter,
);
