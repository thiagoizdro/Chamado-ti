import type { FiltroAtivo as ValorFiltro } from '../../types/paginacao';
import { classeCampo, classeRotulo } from './estilos';

type Props = {
  valor: ValorFiltro;
  aoMudar: (valor: ValorFiltro) => void;
};

export function FiltroAtivo({ valor, aoMudar }: Props) {
  return (
    <div className="w-full sm:w-44">
      <label htmlFor="filtro-ativo" className={classeRotulo}>
        Situação
      </label>
      <select
        id="filtro-ativo"
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value as ValorFiltro)}
        className={classeCampo}
      >
        <option value="ativos">Ativos</option>
        <option value="inativos">Inativos</option>
        <option value="todos">Todos</option>
      </select>
    </div>
  );
}
