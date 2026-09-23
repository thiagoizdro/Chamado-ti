import { createBrowserRouter } from 'react-router';

import { IrParaPaginaInicial } from './components/IrParaPaginaInicial';
import { Layout } from './components/Layout';
import { PaginaEmConstrucao } from './components/PaginaEmConstrucao';
import { RotaProtegida } from './components/RotaProtegida';
import { PAGINAS_DO_MENU } from './lib/navegacao';
import LoginPage from './pages/LoginPage';
import PaginaNaoEncontrada from './pages/PaginaNaoEncontrada';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: (
      <RotaProtegida>
        <Layout />
      </RotaProtegida>
    ),
    children: [
      { index: true, element: <IrParaPaginaInicial /> },
      ...PAGINAS_DO_MENU.map((pagina) => ({
        path: pagina.caminho,
        element: (
          <RotaProtegida perfis={pagina.perfis}>
            <PaginaEmConstrucao titulo={pagina.rotulo} fase={pagina.fase} />
          </RotaProtegida>
        ),
      })),
      { path: '*', element: <PaginaNaoEncontrada /> },
    ],
  },
]);
