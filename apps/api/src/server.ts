import { app } from './app.js';
import { env } from './lib/env.js';

app.listen(env.PORT, () => {
  console.log(`API rodando na porta ${env.PORT}`);
});
