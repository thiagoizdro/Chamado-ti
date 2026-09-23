import { Router } from 'express';

import { idParamSchema } from '../../lib/schemas.js';
import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { validar } from '../../middlewares/validar.js';
import * as categoriasController from './categorias.controller.js';
import { categoriaSchema, listarCategoriasSchema } from './categorias.schemas.js';

export const categoriasRoutes = Router();

categoriasRoutes.use(autenticar);

// Leitura para qualquer logado (select de abertura de chamado); escrita só admin.
categoriasRoutes.get('/', validar({ query: listarCategoriasSchema }), categoriasController.listar);
categoriasRoutes.post(
  '/',
  autorizar('ADMIN'),
  validar({ body: categoriaSchema }),
  categoriasController.criar,
);
categoriasRoutes.put(
  '/:id',
  autorizar('ADMIN'),
  validar({ params: idParamSchema, body: categoriaSchema }),
  categoriasController.atualizar,
);
categoriasRoutes.delete(
  '/:id',
  autorizar('ADMIN'),
  validar({ params: idParamSchema }),
  categoriasController.desativar,
);
