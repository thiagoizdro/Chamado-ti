import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation } from 'react-router';
import { z } from 'zod';

import { useAuth } from '../hooks/useAuth';
import { mensagemDoErro } from '../lib/api';
import { PAGINA_INICIAL } from '../lib/navegacao';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail.').pipe(z.email('Informe um e-mail válido.')),
  senha: z.string().min(1, 'Informe a senha.'),
});

type DadosFormulario = z.infer<typeof loginSchema>;

// A RotaProtegida guarda aqui a página que o usuário tentou abrir.
type EstadoLocalizacao = { de?: string } | null;

export default function LoginPage() {
  const { usuario, entrar } = useAuth();
  const location = useLocation();
  const destino = (location.state as EstadoLocalizacao)?.de;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DadosFormulario>({ resolver: zodResolver(loginSchema) });

  // Único ponto de redirecionamento: vale tanto para quem já chega logado
  // quanto para logo depois do login (entrar() atualiza o usuario).
  // Se o destino for proibido para o perfil, a RotaProtegida corrige.
  if (usuario) {
    return <Navigate to={destino ?? PAGINA_INICIAL[usuario.perfil]} replace />;
  }

  async function aoEnviar(dados: DadosFormulario) {
    try {
      await entrar(dados);
    } catch (erro) {
      setError('root', { message: mensagemDoErro(erro, 'Não foi possível entrar.') });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold text-slate-900">Chamados de TI</h1>
        <p className="mt-1 text-sm text-slate-600">Entre com seu e-mail e senha.</p>

        <form onSubmit={handleSubmit(aoEnviar)} noValidate className="mt-6 space-y-4">
          {errors.root && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
              {errors.root.message}
            </p>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-800">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'email-erro' : undefined}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-700 focus:outline-2 focus:outline-offset-1 focus:outline-blue-700 aria-invalid:border-red-600"
              {...register('email')}
            />
            {errors.email && (
              <p id="email-erro" className="mt-1 text-sm text-red-700">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-slate-800">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.senha ? true : undefined}
              aria-describedby={errors.senha ? 'senha-erro' : undefined}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-700 focus:outline-2 focus:outline-offset-1 focus:outline-blue-700 aria-invalid:border-red-600"
              {...register('senha')}
            />
            {errors.senha && (
              <p id="senha-erro" className="mt-1 text-sm text-red-700">
                {errors.senha.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
