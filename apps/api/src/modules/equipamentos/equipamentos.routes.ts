import { Router } from 'express';

import { paginacaoSchema } from '../../lib/paginacao.js';
import { idParamSchema } from '../../lib/schemas.js';
import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { validar } from '../../middlewares/validar.js';
import * as equipamentosController from './equipamentos.controller.js';
import { equipamentoSchema, listarEquipamentosSchema } from './equipamentos.schemas.js';

export const equipamentosRoutes = Router();

equipamentosRoutes.use(autenticar);

// Lista: qualquer logado (o service limita o solicitante à própria escola).
equipamentosRoutes.get(
  '/',
  validar({ query: listarEquipamentosSchema }),
  equipamentosController.listar,
);

// Detalhe e histórico de defeitos: técnico e admin.
equipamentosRoutes.get(
  '/:id',
  autorizar('TECNICO', 'ADMIN'),
  validar({ params: idParamSchema }),
  equipamentosController.buscar,
);
equipamentosRoutes.get(
  '/:id/chamados',
  autorizar('TECNICO', 'ADMIN'),
  validar({ params: idParamSchema, query: paginacaoSchema }),
  equipamentosController.listarChamados,
);

// Escrita: só admin.
equipamentosRoutes.post(
  '/',
  autorizar('ADMIN'),
  validar({ body: equipamentoSchema }),
  equipamentosController.criar,
);
equipamentosRoutes.put(
  '/:id',
  autorizar('ADMIN'),
  validar({ params: idParamSchema, body: equipamentoSchema }),
  equipamentosController.atualizar,
);
equipamentosRoutes.delete(
  '/:id',
  autorizar('ADMIN'),
  validar({ params: idParamSchema }),
  equipamentosController.desativar,
);
