import type { Perfil } from '../types/usuario';

// Grupos de perfis usados no menu e nas rotas (mesma fonte para os dois).
export const SO_ADMIN: Perfil[] = ['ADMIN'];
export const SO_TECNICO: Perfil[] = ['TECNICO'];
export const EQUIPE_TECNICA: Perfil[] = ['TECNICO', 'ADMIN'];
export const TODOS_OS_PERFIS: Perfil[] = ['SOLICITANTE', 'TECNICO', 'ADMIN'];

// Para onde cada perfil vai depois do login (ou ao tentar abrir uma rota proibida).
export const PAGINA_INICIAL: Record<Perfil, string> = {
  SOLICITANTE: '/chamados',
  TECNICO: '/minha-fila',
  ADMIN: '/dashboard',
};

export const ROTULO_PERFIL: Record<Perfil, string> = {
  SOLICITANTE: 'Solicitante',
  TECNICO: 'Técnico',
  ADMIN: 'Administrador',
};

export type PaginaDoMenu = {
  caminho: string;
  rotulo: string;
  perfis: Perfil[];
};

// As rotas em router.tsx usam os mesmos grupos de perfis deste menu.
export const PAGINAS_DO_MENU: PaginaDoMenu[] = [
  { caminho: '/dashboard', rotulo: 'Dashboard', perfis: SO_ADMIN },
  { caminho: '/minha-fila', rotulo: 'Minha fila', perfis: SO_TECNICO },
  { caminho: '/chamados', rotulo: 'Chamados', perfis: TODOS_OS_PERFIS },
  { caminho: '/equipamentos', rotulo: 'Equipamentos', perfis: EQUIPE_TECNICA },
  { caminho: '/escolas', rotulo: 'Escolas', perfis: SO_ADMIN },
  { caminho: '/usuarios', rotulo: 'Usuários', perfis: SO_ADMIN },
  { caminho: '/categorias', rotulo: 'Categorias', perfis: SO_ADMIN },
];

export function paginasDoPerfil(perfil: Perfil): PaginaDoMenu[] {
  return PAGINAS_DO_MENU.filter((pagina) => pagina.perfis.includes(perfil));
}
