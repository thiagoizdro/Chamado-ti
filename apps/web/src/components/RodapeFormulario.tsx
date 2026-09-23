import { Botao, LinkBotao } from './ui/Botao';

export function RodapeFormulario({
  enviando,
  voltarPara,
}: {
  enviando: boolean;
  voltarPara: string;
}) {
  return (
    <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
      <LinkBotao variante="secundario" to={voltarPara}>
        Cancelar
      </LinkBotao>
      <Botao type="submit" disabled={enviando}>
        {enviando ? 'Salvando…' : 'Salvar'}
      </Botao>
    </div>
  );
}
