import { servicoCrud } from '../lib/crud';
import type { Categoria, DadosCategoria } from '../types/cadastros';

export const categoriasService = servicoCrud<Categoria, DadosCategoria>('/categorias');

export function dadosDaCategoria({ nome }: Categoria): DadosCategoria {
  return { nome };
}
