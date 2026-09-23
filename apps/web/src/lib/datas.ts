// Datas chegam da API em UTC (ISO); a formatação pt-BR acontece só no front.
const formatoDataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

// dd/MM/yyyy HH:mm no fuso do navegador.
export function formatarDataHora(iso: string): string {
  return formatoDataHora.format(new Date(iso)).replace(', ', ' ');
}
