// Erro de negócio esperado: o middleware de erro devolve o statusCode e a
// mensagem para o cliente. Qualquer outro erro vira 500 genérico.
// Com "campo", a resposta também traz { erros: { [campo]: mensagem } },
// no mesmo formato da validação, para o front marcar o campo certo.
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    mensagem: string,
    public readonly campo?: string,
  ) {
    super(mensagem);
    this.name = 'AppError';
  }
}
