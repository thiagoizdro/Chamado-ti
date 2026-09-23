import { Botao } from './Botao';

type Props = {
  pagina: number;
  porPagina: number;
  total: number;
  aoMudarPagina: (pagina: number) => void;
};

export function Paginacao({ pagina, porPagina, total, aoMudarPagina }: Props) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const primeiro = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const ultimo = Math.min(pagina * porPagina, total);

  return (
    <nav
      aria-label="Paginação"
      className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700"
    >
      <p>
        Mostrando {primeiro}–{ultimo} de {total}
      </p>
      <div className="flex items-center gap-2">
        <Botao
          variante="secundario"
          onClick={() => aoMudarPagina(pagina - 1)}
          disabled={pagina <= 1}
        >
          Anterior
        </Botao>
        <span aria-current="page">
          Página {pagina} de {totalPaginas}
        </span>
        <Botao
          variante="secundario"
          onClick={() => aoMudarPagina(pagina + 1)}
          disabled={pagina >= totalPaginas}
        >
          Próxima
        </Botao>
      </div>
    </nav>
  );
}
