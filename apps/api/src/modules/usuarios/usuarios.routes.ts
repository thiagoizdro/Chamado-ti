import { Router } from 'express';

import { idParamSchema } from '../../lib/schemas.js';
import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { validar } from '../../middlewares/validar.js';
import * as usuariosController from './usuarios.controller.js';
import {
  atualizarUsuarioSchema,
  criarUsuarioSchema,
  listarUsuariosSchema,
} from './usuarios.schemas.js';

export const usuariosRoutes = Router();

// Cadastro de usuários: só administrador.
usuariosRoutes.use(autenticar, autorizar('ADMIN'));

usuariosRoutes.get('/', validar({ query: listarUsuariosSchema }), usuariosController.listar);
usuariosRoutes.post('/', validar({ body: criarUsuarioSchema }), usuariosController.criar);
usuariosRoutes.get('/:id', validar({ params: idParamSchema }), usuariosController.buscar);
usuariosRoutes.put(
  '/:id',
  validar({ params: idParamSchema, body: atualizarUsuarioSchema }),
  usuariosController.atualizar,
);
usuariosRoutes.delete('/:id', validar({ params: idParamSchema }), usuariosController.desativar);
