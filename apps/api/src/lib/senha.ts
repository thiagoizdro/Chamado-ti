import bcrypt from 'bcrypt';

// Custo 10: ~70 ms por hash. Lento o bastante para dificultar força bruta,
// rápido o bastante para o login não pesar.
const CUSTO_BCRYPT = 10;

export function gerarHashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, CUSTO_BCRYPT);
}
