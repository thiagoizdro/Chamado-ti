import { Router } from 'express';

import { authRoutes } from './modules/auth/auth.routes.js';
import { categoriasRoutes } from './modules/categorias/categorias.routes.js';
import { escolasRoutes } from './modules/escolas/escolas.routes.js';
import { usuariosRoutes } from './modules/usuarios/usuarios.routes.js';

// Todas as rotas da API (montadas em /api no app.ts).
export const rotas = Router();

rotas.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

rotas.use('/auth', authRoutes);
rotas.use('/escolas', escolasRoutes);
rotas.use('/categorias', categoriasRoutes);
rotas.use('/usuarios', usuariosRoutes);
