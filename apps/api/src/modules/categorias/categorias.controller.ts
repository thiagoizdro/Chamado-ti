import type { Request, Response } from 'express';

import type { IdParam } from '../../lib/schemas.js';
import { usuarioLogado } from '../../middlewares/autenticar.js';
import type { DadosCategoria, FiltrosCategorias } from './categorias.schemas.js';
import * as categoriasService from './categorias.service.js';

export async function listar(req: Request, res: Response) {
  const { perfil } = usuarioLogado(req);
  res.json(await categoriasService.listar(req.query as unknown as FiltrosCategorias, perfil));
}

export async function criar(req: Request, res: Response) {
  res.status(201).json(await categoriasService.criar(req.body as DadosCategoria));
}

export async function atualizar(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  res.json(await categoriasService.atualizar(id, req.body as DadosCategoria));
}

export async function desativar(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  await categoriasService.desativar(id);
  res.status(204).send();
}
