import { Link } from 'react-router';

export default function PaginaNaoEncontrada() {
  return (
    <section>
      <h1 className="text-2xl font-semibold text-slate-900">Página não encontrada</h1>
      <p className="mt-2 text-slate-600">O endereço acessado não existe.</p>
      <Link to="/" className="mt-4 inline-block font-medium text-blue-800 underline">
        Voltar para o início
      </Link>
    </section>
  );
}
