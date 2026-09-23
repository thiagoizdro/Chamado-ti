import { useState } from 'react';

import { useDebounce } from '../../hooks/useDebounce';
import { classeCampo, classeRotulo } from './estilos';

type Props = {
  id: string;
  rotulo: string;
  valor: string;
  aoBuscar: (texto: string) => void;
  placeholder?: string;
};

const ATRASO_BUSCA_MS = 300;

// Busca com debounce: só dispara depois de 300 ms sem digitação.
export function CampoBusca({ id, rotulo, valor, aoBuscar, placeholder }: Props) {
  const [texto, setTexto] = useState(valor);
  const [valorAnterior, setValorAnterior] = useState(valor);
  const buscarComAtraso = useDebounce(aoBuscar, ATRASO_BUSCA_MS);

  // Se a busca mudar por fora (botão voltar), o campo acompanha.
  if (valor !== valorAnterior) {
    setValorAnterior(valor);
    setTexto(valor);
  }

  return (
    <div className="w-full sm:max-w-xs">
      <label htmlFor={id} className={classeRotulo}>
        {rotulo}
      </label>
      <input
        id={id}
        type="search"
        value={texto}
        placeholder={placeholder}
        onChange={(evento) => {
          setTexto(evento.target.value);
          buscarComAtraso(evento.target.value);
        }}
        className={classeCampo}
      />
    </div>
  );
}
