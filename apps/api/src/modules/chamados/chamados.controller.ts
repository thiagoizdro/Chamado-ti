import type { Request, Response } from 'express';

import type { IdParam } from '../../lib/schemas.js';
import { usuarioLogado } from '../../middlewares/autenticar.js';
import type {
  DadosComentario,
  DadosCriarChamado,
  DadosMudarStatus,
  FiltrosChamados,
} from './chamados.schemas.js';
import * as chamadosService from './chamados.service.js';

export async function listar(req: Request, res: Response) {
  const filtros = req.query as unknown as FiltrosChamados;
  res.json(await chamadosService.listar(filtros, usuarioLogado(req)));
}

export async function buscar(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  res.json(await chamadosService.buscarPorId(id, usuarioLogado(req)));
}

export async function criar(req: Request, res: Response) {
  const chamado = await chamadosService.criar(req.body as DadosCriarChamado, usuarioLogado(req));
  res.status(201).json(chamado);
}

export async function assumir(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  res.json(await chamadosService.assumir(id, usuarioLogado(req)));
}

export async function mudarStatus(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  res.json(await chamadosService.mudarStatus(id, req.body as DadosMudarStatus, usuarioLogado(req)));
}

export async function comentar(req: Request, res: Response) {
  const { id } = req.params as unknown as IdParam;
  const comentario = await chamadosService.comentar(
    id,
    req.body as DadosComentario,
    usuarioLogado(req),
  );
  res.status(201).json(comentario);
}
