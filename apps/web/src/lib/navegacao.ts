import type { Perfil } from '../types/usuario';

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
  // Fase do projeto em que a tela será construída (enquanto for provisória).
  fase: number;
};

// Fonte única: o menu e as permissões das rotas saem desta lista,
// então um item nunca aparece no menu para quem não pode abri-lo.
export const PAGINAS_DO_MENU: PaginaDoMenu[] = [
  { caminho: '/dashboard', rotulo: 'Dashboard', perfis: ['ADMIN'], fase: 6 },
  { caminho: '/minha-fila', rotulo: 'Minha fila', perfis: ['TECNICO'], fase: 4 },
  {
    caminho: '/chamados',
    rotulo: 'Chamados',
    perfis: ['SOLICITANTE', 'TECNICO', 'ADMIN'],
    fase: 4,
  },
  { caminho: '/equipamentos', rotulo: 'Equipamentos', perfis: ['TECNICO', 'ADMIN'], fase: 3 },
  { caminho: '/escolas', rotulo: 'Escolas', perfis: ['ADMIN'], fase: 3 },
  { caminho: '/usuarios', rotulo: 'Usuários', perfis: ['ADMIN'], fase: 3 },
  { caminho: '/categorias', rotulo: 'Categorias', perfis: ['ADMIN'], fase: 3 },
];

export function paginasDoPerfil(perfil: Perfil): PaginaDoMenu[] {
  return PAGINAS_DO_MENU.filter((pagina) => pagina.perfis.includes(perfil));
}
