// URL do banco de teste (separado do de desenvolvimento).
// Pode ser trocada com DATABASE_URL_TEST (ex.: no CI).
export const URL_BANCO_TESTE =
  process.env.DATABASE_URL_TEST ?? 'postgresql://chamados:chamados@localhost:5432/chamados_ti_test';

// Trava de segurança: os testes apagam dados, então só rodam num banco
// cujo nome termina em "_test".
export function garantirBancoDeTeste(url: string) {
  const nomeBanco = new URL(url).pathname.slice(1);
  if (!nomeBanco.endsWith('_test')) {
    throw new Error(`Os testes só rodam em banco "*_test", mas recebi "${nomeBanco}".`);
  }
}
