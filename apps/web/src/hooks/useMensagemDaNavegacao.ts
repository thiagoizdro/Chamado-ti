import { useLocation } from 'react-router';

// Mensagem de sucesso passada no navigate (ex.: depois de salvar um formulário).
export function useMensagemDaNavegacao(): string | undefined {
  const { state } = useLocation();
  return (state as { mensagem?: string } | null)?.mensagem;
}
