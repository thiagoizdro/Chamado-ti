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

// Data de calendário (AAAA-MM-DD) no fuso do navegador, o formato dos filtros da API.
export function dataISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function diasAtras(dias: number, hoje = new Date()): string {
  const data = new Date(hoje);
  data.setDate(data.getDate() - dias);
  return dataISO(data);
}

const formatoNumero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export function formatarNumero(valor: number): string {
  return formatoNumero.format(valor);
}
