import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '../hooks/useAuth';
import { PAGINA_INICIAL } from '../lib/navegacao';
import type { Perfil } from '../types/usuario';

type Props = {
  // Sem perfis = basta estar logado.
  perfis?: Perfil[];
  children?: ReactNode;
};

export function RotaProtegida({ perfis, children }: Props) {
  const { usuario, carregando } = useAuth();
  const location = useLocation();

  if (carregando) {
    return (
      <p role="status" className="p-6 text-slate-600">
        Carregando…
      </p>
    );
  }

  if (!usuario) {
    // Guarda a página pedida para voltar a ela depois do login.
    return <Navigate to="/login" replace state={{ de: location.pathname + location.search }} />;
  }

  if (perfis && !perfis.includes(usuario.perfil)) {
    return <Navigate to={PAGINA_INICIAL[usuario.perfil]} replace />;
  }

  return children ?? <Outlet />;
}
