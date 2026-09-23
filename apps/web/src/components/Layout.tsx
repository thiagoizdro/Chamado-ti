import { NavLink, Outlet, useNavigate } from 'react-router';

import { useAuth } from '../hooks/useAuth';
import { paginasDoPerfil, ROTULO_PERFIL } from '../lib/navegacao';

const classeFoco =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700';

export function Layout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();

  // O Layout só é renderizado dentro de uma RotaProtegida.
  if (!usuario) return null;

  async function aoSair() {
    await sair();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <a
        href="#conteudo"
        className={`sr-only rounded bg-white px-3 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 ${classeFoco}`}
      >
        Pular para o conteúdo
      </a>

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="text-lg font-semibold text-slate-900">Chamados de TI</span>

          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-medium text-slate-900">{usuario.nome}</p>
              <p className="text-slate-600">
                {ROTULO_PERFIL[usuario.perfil]}
                {usuario.escola && ` · ${usuario.escola.nome}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void aoSair()}
              className={`rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 ${classeFoco}`}
            >
              Sair
            </button>
          </div>
        </div>

        <nav aria-label="Menu principal" className="mx-auto max-w-6xl overflow-x-auto px-4">
          <ul className="flex gap-1">
            {paginasDoPerfil(usuario.perfil).map((pagina) => (
              <li key={pagina.caminho}>
                <NavLink
                  to={pagina.caminho}
                  className={({ isActive }) =>
                    `block border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap ${classeFoco} ${
                      isActive
                        ? 'border-blue-700 text-blue-800'
                        : 'border-transparent text-slate-700 hover:text-slate-900'
                    }`
                  }
                >
                  {pagina.rotulo}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="conteudo" className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
