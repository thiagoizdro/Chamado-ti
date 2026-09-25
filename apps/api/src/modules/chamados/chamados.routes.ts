import { Router } from 'express';

import { idParamSchema } from '../../lib/schemas.js';
import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { validar } from '../../middlewares/validar.js';
import * as chamadosController from './chamados.controller.js';
import {
  comentarioSchema,
  criarChamadoSchema,
  listarChamadosSchema,
  mudarStatusSchema,
} from './chamados.schemas.js';

export const chamadosRoutes = Router();

chamadosRoutes.use(autenticar);

// Listar, ver e comentar: qualquer logado. O service limita o solicitante
// aos chamados da própria escola.
chamadosRoutes.get('/', validar({ query: listarChamadosSchema }), chamadosController.listar);
chamadosRoutes.get('/:id', validar({ params: idParamSchema }), chamadosController.buscar);
chamadosRoutes.post(
  '/:id/comentarios',
  validar({ params: idParamSchema, body: comentarioSchema }),
  chamadosController.comentar,
);

// Abrir: solicitante (na própria escola) e admin (escolhe a escola).
chamadosRoutes.post(
  '/',
  autorizar('SOLICITANTE', 'ADMIN'),
  validar({ body: criarChamadoSchema }),
  chamadosController.criar,
);

// Atendimento: técnico e admin.
chamadosRoutes.patch(
  '/:id/assumir',
  autorizar('TECNICO', 'ADMIN'),
  validar({ params: idParamSchema }),
  chamadosController.assumir,
);
chamadosRoutes.patch(
  '/:id/status',
  autorizar('TECNICO', 'ADMIN'),
  validar({ params: idParamSchema, body: mudarStatusSchema }),
  chamadosController.mudarStatus,
);
