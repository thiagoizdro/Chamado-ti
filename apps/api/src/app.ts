import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { z } from 'zod';

import { env } from './lib/env.js';
import { rotaNaoEncontrada, tratarErro } from './middlewares/erro.js';
import { rotas } from './routes.js';

// Mensagens padrão do Zod em português (os schemas podem sobrescrever).
z.config(z.locales.ptBR());

export const app = express();

app.use(helmet());
// Front e API ficam na mesma origem (proxy do Vite / rewrite da Vercel),
// então o CORS é só uma salvaguarda restrita à origem conhecida.
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api', rotas);
app.use('/api', rotaNaoEncontrada);

// Precisa ser o último middleware registrado.
app.use(tratarErro);
