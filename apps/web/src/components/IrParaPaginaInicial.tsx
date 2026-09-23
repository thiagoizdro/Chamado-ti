import { Navigate } from 'react-router';

import { useAuth } from '../hooks/useAuth';
import { PAGINA_INICIAL } from '../lib/navegacao';

// "/" leva cada perfil para a sua página inicial.
export function IrParaPaginaInicial() {
  const { usuario } = useAuth();
  return usuario ? <Navigate to={PAGINA_INICIAL[usuario.perfil]} replace /> : null;
}
