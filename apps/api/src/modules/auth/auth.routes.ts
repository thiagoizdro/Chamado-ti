import { Router } from 'express';

import { autenticar } from '../../middlewares/autenticar.js';
import { validar } from '../../middlewares/validar.js';
import * as authController from './auth.controller.js';
import { loginSchema } from './auth.schemas.js';

export const authRoutes = Router();

authRoutes.post('/login', validar({ body: loginSchema }), authController.login);
authRoutes.post('/logout', authController.logout);
authRoutes.get('/me', autenticar, authController.me);
