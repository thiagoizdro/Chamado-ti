import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router';

import { IrParaPaginaInicial } from './components/IrParaPaginaInicial';
import { Layout } from './components/Layout';
import { RotaProtegida } from './components/RotaProtegida';
import {
  EQUIPE_TECNICA,
  SO_ADMIN,
  SO_TECNICO,
  SOLICITANTE_E_ADMIN,
  TODOS_OS_PERFIS,
} from './lib/navegacao';
import AbrirChamadoPage from './pages/chamados/AbrirChamadoPage';
import DetalheChamadoPage from './pages/chamados/DetalheChamadoPage';
import ListaChamadosPage from './pages/chamados/ListaChamadosPage';
import MinhaFilaPage from './pages/chamados/MinhaFilaPage';
import FormularioCategoriaPage from './pages/categorias/FormularioCategoriaPage';
import ListaCategoriasPage from './pages/categorias/ListaCategoriasPage';
import DetalheEquipamentoPage from './pages/equipamentos/DetalheEquipamentoPage';
import FormularioEquipamentoPage from './pages/equipamentos/FormularioEquipamentoPage';
import ListaEquipamentosPage from './pages/equipamentos/ListaEquipamentosPage';
import FormularioEscolaPage from './pages/escolas/FormularioEscolaPage';
import ListaEscolasPage from './pages/escolas/ListaEscolasPage';
import LoginPage from './pages/LoginPage';
import PaginaNaoEncontrada from './pages/PaginaNaoEncontrada';
import FormularioUsuarioPage from './pages/usuarios/FormularioUsuarioPage';
import ListaUsuariosPage from './pages/usuarios/ListaUsuariosPage';
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
        element: protegida(SO_ADMIN),
        children: [
          {
            index: true,
            // Carrega sob demanda: só o dashboard usa o Recharts (a maior
            // dependência) e só o admin o acessa. Os outros perfis não baixam esse código.
            lazy: () =>
              import('./pages/DashboardPage').then((modulo) => ({ Component: modulo.default })),
          },
        ],
      },
      {
        path: 'minha-fila',
        element: protegida(SO_TECNICO, <MinhaFilaPage />),
      },
      {
        path: 'chamados',
        element: protegida(TODOS_OS_PERFIS),
        children: [
          { index: true, element: <ListaChamadosPage /> },
          // Técnico atende, não abre (a API também recusa).
          { path: 'novo', element: protegida(SOLICITANTE_E_ADMIN, <AbrirChamadoPage />) },
          { path: ':id', element: <DetalheChamadoPage /> },
        ],
      },
      {
        path: 'equipamentos',
        element: protegida(EQUIPE_TECNICA),
        children: [
          { index: true, element: <ListaEquipamentosPage /> },
          { path: ':id', element: <DetalheEquipamentoPage /> },
          // Escrita só para admin (técnico vê lista e detalhe).
          { path: 'novo', element: protegida(SO_ADMIN, <FormularioEquipamentoPage />) },
          { path: ':id/editar', element: protegida(SO_ADMIN, <FormularioEquipamentoPage />) },
        ],
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
        element: protegida(SO_ADMIN),
        children: [
          { index: true, element: <ListaUsuariosPage /> },
          { path: 'novo', element: <FormularioUsuarioPage /> },
          { path: ':id/editar', element: <FormularioUsuarioPage /> },
        ],
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
