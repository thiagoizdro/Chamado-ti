// Erro de negócio esperado: o middleware de erro devolve o statusCode e a
// mensagem para o cliente. Qualquer outro erro vira 500 genérico.
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = 'AppError';
  }
}
