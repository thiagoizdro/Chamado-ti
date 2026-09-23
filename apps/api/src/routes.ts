import { Router } from 'express';

import { authRoutes } from './modules/auth/auth.routes.js';
import { escolasRoutes } from './modules/escolas/escolas.routes.js';

// Todas as rotas da API (montadas em /api no app.ts).
export const rotas = Router();

rotas.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

rotas.use('/auth', authRoutes);
rotas.use('/escolas', escolasRoutes);
