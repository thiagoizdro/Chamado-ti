import { usuariosService } from '../services/usuarios.service';
import { criarHooksCrud } from './criarHooksCrud';

export const {
  useLista: useListaUsuarios,
  useItem: useUsuario,
  useSalvar: useSalvarUsuario,
  useDesativar: useDesativarUsuario,
} = criarHooksCrud('usuarios', usuariosService);
