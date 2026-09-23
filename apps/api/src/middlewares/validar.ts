import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

type Esquemas = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

const ORIGENS = ['body', 'params', 'query'] as const;

// Valida body, params e query com Zod. Se algo falhar, responde 400 com o
// primeiro erro de cada campo; se passar, troca os dados pela versão
// validada (com defaults e conversões do schema aplicados).
export function validar(esquemas: Esquemas): RequestHandler {
  return (req, res, next) => {
    const erros: Record<string, string> = {};

    for (const origem of ORIGENS) {
      const esquema = esquemas[origem];
      if (!esquema) continue;

      const resultado = esquema.safeParse(req[origem]);
      if (!resultado.success) {
        for (const problema of resultado.error.issues) {
          const campo = problema.path.join('.') || origem;
          erros[campo] ??= problema.message;
        }
        continue;
      }

      // No Express 5, req.query é só leitura; defineProperty funciona para as três origens.
      Object.defineProperty(req, origem, {
        value: resultado.data,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }

    if (Object.keys(erros).length > 0) {
      res.status(400).json({ mensagem: 'Dados inválidos.', erros });
      return;
    }

    next();
  };
}
