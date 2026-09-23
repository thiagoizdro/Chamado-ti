import type { Request, Response } from 'express';

import type { Paginacao } from '../../lib/paginacao.js';
import type { IdParam } from '../../lib/schemas.js';
import { usuarioLogado } from '../../middlewares/autenticar.js';
import type { DadosEquipamento, FiltrosEquipamentos } from './equipamentos.schemas.js';
import * as equipamentosService from './equipamentos.service.js';

export async function listar(req: Request, res: Response) {
  const filtros = req.query as unknown as FiltrosEquipamentos;
  res.json(await equipamentosService.listar(filtros, usuarioLogado(req)));
}

export async function buscar(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  res.json(await equipamentosService.buscarPorId(id));
}

export async function listarChamados(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  res.json(await equipamentosService.listarChamados(id, req.query as unknown as Paginacao));
}

export async function criar(req: Request, res: Response) {
  res.status(201).json(await equipamentosService.criar(req.body as DadosEquipamento));
}

export async function atualizar(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  res.json(await equipamentosService.atualizar(id, req.body as DadosEquipamento));
}

export async function desativar(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  await equipamentosService.desativar(id);
  res.status(204).send();
}
