import type { Request, Response } from 'express';

import type { IdParam } from '../../lib/schemas.js';
import type { DadosEscola, FiltrosEscolas } from './escolas.schemas.js';
import * as escolasService from './escolas.service.js';

// Os dados de req já foram validados (e convertidos) pelo middleware validar.

export async function listar(req: Request, res: Response) {
  res.json(await escolasService.listar(req.query as unknown as FiltrosEscolas));
}

export async function buscar(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  res.json(await escolasService.buscarPorId(id));
}

export async function criar(req: Request, res: Response) {
  res.status(201).json(await escolasService.criar(req.body as DadosEscola));
}

export async function atualizar(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  res.json(await escolasService.atualizar(id, req.body as DadosEscola));
}

export async function desativar(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  await escolasService.desativar(id);
  res.status(204).send();
}
