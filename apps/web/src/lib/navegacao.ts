import type { Perfil } from '../types/usuario';

// Para onde cada perfil vai depois do login (ou ao tentar abrir uma rota proibida).
export const PAGINA_INICIAL: Record<Perfil, string> = {
  SOLICITANTE: '/chamados',
  TECNICO: '/minha-fila',
  ADMIN: '/dashboard',
};
