import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router';

import { IrParaPaginaInicial } from './components/IrParaPaginaInicial';
import { Layout } from './components/Layout';
import { PaginaEmConstrucao } from './components/PaginaEmConstrucao';
import { RotaProtegida } from './components/RotaProtegida';
import { EQUIPE_TECNICA, SO_ADMIN, SO_TECNICO, TODOS_OS_PERFIS } from './lib/navegacao';
import FormularioCategoriaPage from './pages/categorias/FormularioCategoriaPage';
import ListaCategoriasPage from './pages/categorias/ListaCategoriasPage';
import FormularioEscolaPage from './pages/escolas/FormularioEscolaPage';
import ListaEscolasPage from './pages/escolas/ListaEscolasPage';
import LoginPage from './pages/LoginPage';
import PaginaNaoEncontrada from './pages/PaginaNaoEncontrada';
import type { Perfil } from './types/usuario';

// Sem "elemento", a rota protegida só renderiza as rotas filhas (<Outlet />).
function protegida(perfis: Perfil[], elemento?: ReactNode) {
  return <RotaProtegida perfis={perfis}>{elemento}</RotaProtegida>;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: protegida(TODOS_OS_PERFIS, <Layout />),
    children: [
      { index: true, element: <IrParaPaginaInicial /> },
      {
        path: 'dashboard',
        element: protegida(SO_ADMIN, <PaginaEmConstrucao titulo="Dashboard" fase={6} />),
      },
      {
        path: 'minha-fila',
        element: protegida(SO_TECNICO, <PaginaEmConstrucao titulo="Minha fila" fase={4} />),
      },
      {
        path: 'chamados',
        element: protegida(TODOS_OS_PERFIS, <PaginaEmConstrucao titulo="Chamados" fase={4} />),
      },
      {
        path: 'equipamentos',
        element: protegida(EQUIPE_TECNICA, <PaginaEmConstrucao titulo="Equipamentos" fase={3} />),
      },
      {
        path: 'escolas',
        element: protegida(SO_ADMIN),
        children: [
          { index: true, element: <ListaEscolasPage /> },
          { path: 'novo', element: <FormularioEscolaPage /> },
          { path: ':id/editar', element: <FormularioEscolaPage /> },
        ],
      },
      {
        path: 'usuarios',
        element: protegida(SO_ADMIN, <PaginaEmConstrucao titulo="Usuários" fase={3} />),
      },
      {
        path: 'categorias',
        element: protegida(SO_ADMIN),
        children: [
          { index: true, element: <ListaCategoriasPage /> },
          { path: 'novo', element: <FormularioCategoriaPage /> },
          { path: ':id/editar', element: <FormularioCategoriaPage /> },
        ],
      },
      { path: '*', element: <PaginaNaoEncontrada /> },
    ],
  },
]);
