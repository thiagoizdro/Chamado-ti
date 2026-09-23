import { categoriasService } from '../services/categorias.service';
import { criarHooksCrud } from './criarHooksCrud';

export const {
  useLista: useListaCategorias,
  useItem: useCategoria,
  useSalvar: useSalvarCategoria,
  useDesativar: useDesativarCategoria,
} = criarHooksCrud('categorias', categoriasService);
