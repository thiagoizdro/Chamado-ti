import { escolasService } from '../services/escolas.service';
import { criarHooksCrud } from './criarHooksCrud';

export const {
  useLista: useListaEscolas,
  useItem: useEscola,
  useSalvar: useSalvarEscola,
  useDesativar: useDesativarEscola,
} = criarHooksCrud('escolas', escolasService);
