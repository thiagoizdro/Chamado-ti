import { Navigate } from 'react-router';

import { useAuth } from './hooks/useAuth';

// Página provisória: vira o layout com menu no próximo passo.
function App() {
  const { usuario, carregando, sair } = useAuth();

  if (carregando) return <p className="p-6 text-slate-600">Carregando…</p>;
  if (!usuario) return <Navigate to="/login" replace />;

  return (
    <main className="p-6">
      <p className="text-slate-900">
        Olá, {usuario.nome} ({usuario.perfil})
      </p>
      <button type="button" onClick={() => void sair()} className="mt-4 underline">
        Sair
      </button>
    </main>
  );
}

export default App;
