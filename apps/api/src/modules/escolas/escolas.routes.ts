import { Router } from 'express';

import { idParamSchema } from '../../lib/schemas.js';
import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { validar } from '../../middlewares/validar.js';
import * as escolasController from './escolas.controller.js';
import { escolaSchema, listarEscolasSchema } from './escolas.schemas.js';

export const escolasRoutes = Router();

// Cadastro de escolas: só administrador.
escolasRoutes.use(autenticar, autorizar('ADMIN'));

escolasRoutes.get('/', validar({ query: listarEscolasSchema }), escolasController.listar);
escolasRoutes.post('/', validar({ body: escolaSchema }), escolasController.criar);
escolasRoutes.get('/:id', validar({ params: idParamSchema }), escolasController.buscar);
escolasRoutes.put(
  '/:id',
  validar({ params: idParamSchema, body: escolaSchema }),
  escolasController.atualizar,
);
escolasRoutes.delete('/:id', validar({ params: idParamSchema }), escolasController.desativar);
