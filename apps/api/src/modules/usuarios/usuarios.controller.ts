import type { Request, Response } from 'express';

import type { IdParam } from '../../lib/schemas.js';
import { usuarioLogado } from '../../middlewares/autenticar.js';
import type {
  DadosAtualizarUsuario,
  DadosCriarUsuario,
  FiltrosUsuarios,
} from './usuarios.schemas.js';
import * as usuariosService from './usuarios.service.js';

export async function listar(req: Request, res: Response) {
  res.json(await usuariosService.listar(req.query as unknown as FiltrosUsuarios));
}

export async function buscar(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  res.json(await usuariosService.buscarPorId(id));
}

export async function criar(req: Request, res: Response) {
  res.status(201).json(await usuariosService.criar(req.body as DadosCriarUsuario));
}

export async function atualizar(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  const dados = req.body as DadosAtualizarUsuario;
  res.json(await usuariosService.atualizar(id, dados, usuarioLogado(req).id));
}

export async function desativar(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  await usuariosService.desativar(id, usuarioLogado(req).id);
  res.status(204).send();
}
