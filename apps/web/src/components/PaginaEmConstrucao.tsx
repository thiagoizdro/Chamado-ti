type Props = {
  titulo: string;
  fase: number;
};

// Ocupa o lugar das telas que ainda serão construídas.
export function PaginaEmConstrucao({ titulo, fase }: Props) {
  return (
    <section>
      <h1 className="text-2xl font-semibold text-slate-900">{titulo}</h1>
      <p className="mt-2 text-slate-600">Esta tela será construída na Fase {fase}.</p>
    </section>
  );
}
