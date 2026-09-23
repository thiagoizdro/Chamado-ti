# CLAUDE.md — Sistema de Chamados de TI para Redes de Ensino

Este arquivo é o contexto permanente do projeto. Leia-o inteiro antes de qualquer tarefa e siga-o à risca. Se algo aqui entrar em conflito com um pedido meu, pergunte antes de agir.

## 1. Sobre o projeto

Sistema full stack onde escolas de uma rede de ensino abrem chamados de TI (impressora parada, PC sem internet, projetor com defeito). A equipe técnica organiza, atribui, atende e registra a solução. A gestão acompanha indicadores num dashboard.

É um projeto de portfólio de um desenvolvedor júnior. Por isso:
- Código limpo, legível e idiomático vale mais que código "esperto".
- Cada decisão técnica relevante deve ser explicada em linguagem simples no fim de cada fase (eu preciso conseguir defendê-la numa entrevista).
- README, seed de dados realista e deploy funcionando são parte do produto, não detalhe.

## 2. Regras de trabalho (obrigatórias)

1. Trabalhe UMA fase por vez (seção 8). Ao terminar uma fase, pare, mostre o resumo e espere meu "ok" antes de seguir.
2. Antes de escrever código de uma fase, apresente um plano curto (arquivos que vai criar/alterar e por quê) e espere minha aprovação.
3. Não implemente nada da seção 9 ("Fora do MVP"). Se achar que algo é necessário, pergunte.
4. Não adicione bibliotecas além das listadas na seção 3 sem justificar e pedir permissão.
5. Ao final de cada fase, rode lint, typecheck e testes existentes e corrija o que falhar antes de dizer que terminou.
6. Faça commits pequenos e frequentes com Conventional Commits em português (ex.: `feat(chamados): adiciona fluxo de status`). Um commit por passo lógico, nunca um commitão por fase.
7. Nunca coloque segredos no código. Use `.env` (ignorado no git) e mantenha o `.env.example` atualizado.
8. Se um comando falhar ou algo estiver ambíguo, explique o problema e proponha opções em vez de contornar em silêncio.
9. Idioma: nomes de domínio (tabelas, campos, rotas, componentes de página) em português, como no schema abaixo. Termos técnicos padrão (controller, service, middleware, hook) podem ficar em inglês. Comentários e mensagens de erro para o usuário em português.

## 3. Stack

- Monorepo com npm workspaces: `apps/api` e `apps/web`.
- **Runtime:** Node.js 24 (imagem Docker `node:24-alpine`).
- **API:** TypeScript, Express, Prisma 7 (configuração em `prisma.config.ts`, driver adapter `@prisma/adapter-pg`), PostgreSQL 16, Zod (validação), bcrypt (hash de senha), jsonwebtoken, cookie-parser, cors, helmet. Em dev roda com `tsx watch`.
- **Web:** React + TypeScript (Vite), Tailwind CSS v4 (plugin `@tailwindcss/vite`, sem `tailwind.config.js`), React Router, TanStack Query, React Hook Form + Zod, Axios, Recharts.
- **Testes:** Vitest + Supertest (API). Banco de teste separado.
- **Qualidade:** ESLint (flat config) + Prettier, TypeScript em modo `strict`.
- **Dependências de dev aprovadas:** `tsx`, `typescript-eslint`, `@eslint/js`, `globals`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-config-prettier`, `@vitejs/plugin-react` e os `@types` de node, express, cors, cookie-parser, jsonwebtoken, bcrypt e supertest.
- **Versões fixadas:** TypeScript 6.0 (o typescript-eslint ainda não suporta o TS 7) e Prisma `^7` (o `latest` do npm aponta para um RC da v8).
- **Infra local:** Docker Compose em modo dev com `db`, `api` e `web` (código montado por volume: API com `tsx watch`, web com Vite dev server). Tudo sobe com `docker compose up`.
- **Dockerfiles:** API multi-stage (`dev` usado pelo Compose; `prod` com build compilado para o deploy). Web sem imagem de produção (deploy é na Vercel).
- **Deploy:** front na Vercel; API + Postgres no Render ou Railway.
- **Seed:** @faker-js/faker (locale pt_BR).

## 4. Arquitetura

API em camadas: `routes → controllers → services → Prisma`.
- **Controller:** só HTTP (lê req, chama service, devolve res). Sem regra de negócio.
- **Service:** todas as regras (escopo por perfil, transições de status, transações).
- **Validação:** schemas Zod por módulo em `*.schemas.ts`, aplicados por middleware.
- **Erros:** classe `AppError(statusCode, mensagem)` + middleware de erro centralizado. Erros do Prisma mapeados (ex.: P2002 → 409 com mensagem amigável).

Estrutura esperada:

```
chamados-ti/
├── CLAUDE.md
├── README.md
├── docker-compose.yml
├── .env.example
├── apps/
│   ├── api/
│   │   ├── Dockerfile (multi-stage: dev e prod)
│   │   ├── prisma.config.ts
│   │   ├── prisma/ (schema.prisma, migrations/, seed.ts)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/ usuarios/ escolas/ categorias/ equipamentos/ chamados/ dashboard/
│   │   │   │   └── (cada um: *.routes.ts, *.controller.ts, *.service.ts, *.schemas.ts)
│   │   │   ├── middlewares/ (autenticar.ts, autorizar.ts, validar.ts, erro.ts)
│   │   │   ├── lib/ (prisma.ts, jwt.ts, AppError.ts)
│   │   │   ├── app.ts   (monta o Express, exportado para os testes)
│   │   │   └── server.ts (só faz listen)
│   │   └── tests/
│   └── web/
│       ├── Dockerfile (só dev)
│       ├── vite.config.ts (Tailwind + proxy /api)
│       └── src/
│           ├── pages/ components/ hooks/ services/ contexts/ lib/
│           └── main.tsx
```

## 5. Modelo de dados (Prisma)

Use este schema como base. Nomes de tabela em snake_case via `@@map`, colunas via `@map` quando necessário.

```prisma
enum Perfil        { SOLICITANTE TECNICO ADMIN }
enum StatusChamado { ABERTO EM_ATENDIMENTO AGUARDANDO_PECA RESOLVIDO }
enum Prioridade    { BAIXA MEDIA ALTA CRITICA }
enum AcaoHistorico { CRIADO ATRIBUIDO STATUS_ALTERADO COMENTARIO SOLUCAO_REGISTRADA }

model Escola {
  id           Int           @id @default(autoincrement())
  nome         String
  codigoInep   String?       @unique @map("codigo_inep")
  endereco     String?
  ativo        Boolean       @default(true)
  usuarios     Usuario[]
  equipamentos Equipamento[]
  chamados     Chamado[]
  @@map("escolas")
}

model Usuario {
  id                 Int                @id @default(autoincrement())
  nome               String
  email              String             @unique
  senhaHash          String             @map("senha_hash")
  perfil             Perfil
  escolaId           Int?               @map("escola_id")
  escola             Escola?            @relation(fields: [escolaId], references: [id])
  ativo              Boolean            @default(true)
  chamadosAbertos    Chamado[]          @relation("Solicitante")
  chamadosAtribuidos Chamado[]          @relation("Tecnico")
  historicos         HistoricoChamado[]
  criadoEm           DateTime           @default(now()) @map("criado_em")
  @@map("usuarios")
}

model Categoria {
  id       Int       @id @default(autoincrement())
  nome     String    @unique
  ativo    Boolean   @default(true)
  chamados Chamado[]
  @@map("categorias")
}

model Equipamento {
  id          Int       @id @default(autoincrement())
  patrimonio  String    @unique
  tipo        String
  marca       String?
  modelo      String?
  localizacao String?
  escolaId    Int       @map("escola_id")
  escola      Escola    @relation(fields: [escolaId], references: [id])
  ativo       Boolean   @default(true)
  chamados    Chamado[]
  @@index([escolaId])
  @@map("equipamentos")
}

model Chamado {
  id            Int                @id @default(autoincrement())
  titulo        String
  descricao     String
  prioridade    Prioridade         @default(MEDIA)
  status        StatusChamado      @default(ABERTO)
  solucao       String?
  escolaId      Int                @map("escola_id")
  equipamentoId Int?               @map("equipamento_id")
  categoriaId   Int                @map("categoria_id")
  solicitanteId Int                @map("solicitante_id")
  tecnicoId     Int?               @map("tecnico_id")
  escola        Escola             @relation(fields: [escolaId], references: [id])
  equipamento   Equipamento?       @relation(fields: [equipamentoId], references: [id])
  categoria     Categoria          @relation(fields: [categoriaId], references: [id])
  solicitante   Usuario            @relation("Solicitante", fields: [solicitanteId], references: [id])
  tecnico       Usuario?           @relation("Tecnico", fields: [tecnicoId], references: [id])
  historico     HistoricoChamado[]
  abertoEm      DateTime           @default(now()) @map("aberto_em")
  resolvidoEm   DateTime?          @map("resolvido_em")
  atualizadoEm  DateTime           @updatedAt @map("atualizado_em")
  @@index([status])
  @@index([escolaId])
  @@index([equipamentoId])
  @@map("chamados")
}

model HistoricoChamado {
  id             Int            @id @default(autoincrement())
  chamadoId      Int            @map("chamado_id")
  usuarioId      Int            @map("usuario_id")
  acao           AcaoHistorico
  statusAnterior StatusChamado? @map("status_anterior")
  statusNovo     StatusChamado? @map("status_novo")
  descricao      String?
  criadoEm       DateTime       @default(now()) @map("criado_em")
  chamado        Chamado        @relation(fields: [chamadoId], references: [id], onDelete: Cascade)
  usuario        Usuario        @relation(fields: [usuarioId], references: [id])
  @@index([chamadoId])
  @@map("historico_chamado")
}
```

## 6. Regras de negócio

### Perfis e permissões
- **SOLICITANTE** (diretor/secretário): abre chamados e acompanha os da SUA escola. Não muda status, não vê outras escolas, não acessa cadastros nem dashboard.
- **TECNICO:** vê todos os chamados, assume, muda status, comenta, registra solução. Vê equipamentos (somente leitura), incluindo detalhe e histórico de chamados de cada máquina.
- **ADMIN:** tudo do técnico + CRUD de escolas, usuários, categorias e equipamentos + dashboard.

Checar só o perfil NÃO basta. Todo acesso de solicitante a chamado filtra por `escolaId` do usuário logado no service (evitar IDOR). Acesso a recurso de outra escola retorna 404, não 403.

### Usuários
- Senha com bcrypt (custo 10). `senhaHash` nunca sai em resposta da API.
- Usuário SOLICITANTE exige `escolaId`. TECNICO e ADMIN não têm escola.
- Usuário inativo não consegue logar.

### Fluxo de status (máquina de estados em `modules/chamados/status.ts`)
```
ABERTO          → EM_ATENDIMENTO
EM_ATENDIMENTO  → AGUARDANDO_PECA | RESOLVIDO
AGUARDANDO_PECA → EM_ATENDIMENTO
RESOLVIDO       → (nenhuma; reabertura está fora do MVP)
```
- Transição inválida → 422 com mensagem clara.
- "Assumir" só em chamado ABERTO sem técnico: define `tecnicoId`, muda para EM_ATENDIMENTO e grava ATRIBUIDO + STATUS_ALTERADO no histórico.
- Assumir deve ser à prova de concorrência: `updateMany` com `where { id, status: ABERTO, tecnicoId: null }`; se `count === 0`, responder 409.
- Ir para RESOLVIDO exige `solucao` (texto não vazio), preenche `resolvidoEm` e grava STATUS_ALTERADO + SOLUCAO_REGISTRADA (com a solução na `descricao`) no histórico.
- O equipamento informado na abertura deve pertencer à escola do chamado. Para SOLICITANTE, a escola é sempre a dele (ignorar escola enviada no body).

### Histórico
- TODA alteração em chamado (criação, atribuição, status, comentário, solução) grava um registro em `historico_chamado` DENTRO da mesma `prisma.$transaction`.
- Histórico é imutável: sem update/delete via API.

### Exclusões
- Escolas, usuários, categorias e equipamentos usam soft delete (`ativo = false`). Nunca apagar registros que têm chamados.

## 7. Contrato da API (MVP)

Prefixo `/api`. Respostas de lista paginadas: `{ dados, total, pagina, porPagina }`.

- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET|POST /escolas`, `GET|PUT|DELETE /escolas/:id` (admin)
- `GET|POST /usuarios`, `GET|PUT|DELETE /usuarios/:id` (admin)
- `GET|POST /categorias`, `PUT|DELETE /categorias/:id` (GET liberado a todos logados; escrita só admin)
- `GET|POST /equipamentos`, `GET|PUT|DELETE /equipamentos/:id` (escrita só admin; `GET /equipamentos` liberado a todos logados, mas solicitante só recebe os da sua escola, para o select de abertura; `GET /equipamentos/:id` só técnico/admin)
- `GET /equipamentos/:id/chamados` → histórico de defeitos da máquina (só técnico/admin)
- `POST /chamados`, `GET /chamados`, `GET /chamados/:id` (inclui histórico com nome do usuário)
- `PATCH /chamados/:id/assumir`, `PATCH /chamados/:id/status`, `POST /chamados/:id/comentarios`
- `GET /dashboard?de=&ate=&escolaId=` (admin)

Filtros de `GET /chamados` (validados com Zod): `status`, `prioridade`, `escolaId`, `categoriaId`, `tecnicoId`, `de`, `ate`, `q`, `pagina`, `porPagina`. `q` busca (case-insensitive) em título, descrição e patrimônio do equipamento.

Dashboard retorna: totais por status, chamados por escola, chamados por categoria, top 10 equipamentos com mais chamados (com patrimônio, tipo, modelo e escola) e tempo médio de resolução em horas (via `$queryRaw`, só chamados RESOLVIDOS no período).

### Autenticação
- JWT com payload `{ sub, perfil, escolaId }`, expiração de 8h, assinado com `JWT_SECRET`.
- Enviado em cookie httpOnly `token`, sempre com `SameSite=Lax` e `Path=/`. Em produção também `Secure`.
- Front e API ficam na **mesma origem** do ponto de vista do navegador, então o cookie é first-party:
  - Dev: proxy do Vite encaminha `/api` para o container da API.
  - Produção: rewrite da Vercel (`vercel.json`) encaminha `/api/*` para a URL da API no Render/Railway.
- Axios usa `baseURL: '/api'` (sem URL absoluta da API no front).
- CORS: como o navegador nunca chama a API em outra origem, o CORS não é necessário no fluxo normal. O middleware `cors` fica configurado de forma restritiva (`origin: process.env.CORS_ORIGIN`, `credentials: true`) apenas como salvaguarda; nunca usar `origin: '*'`.
- 401 no front → limpar estado de auth e redirecionar para `/login`.

## 8. Fases (uma por vez, com minha aprovação entre elas)

Cada fase só termina quando todos os itens de "Pronto quando" forem verdadeiros.

### Fase 0 — Setup
Monorepo, TS strict nos dois apps, ESLint/Prettier, Tailwind v4 configurado, Dockerfile da API (multi-stage) e do web (dev), `docker-compose.yml` em modo dev (db com healthcheck; api só sobe com db saudável e roda `prisma migrate deploy` no start), proxy `/api` no Vite, `.env.example`, `.gitignore`, rota `GET /api/health`. Prisma 7 com `prisma.config.ts`; `schema.prisma` só com `datasource` e `generator` (os models entram na Fase 1). Vitest + Supertest configurados com um teste de `GET /api/health`.
**Pronto quando:** `docker compose up` sobe os três serviços, `/api/health` responde 200 (direto e via proxy do Vite), a página inicial do web abre e lint, typecheck e o teste de health passam.

### Fase 1 — Banco e seed
Schema da seção 5, migration inicial, `seed.ts` com: 1 admin, 3 técnicos, 5 escolas (nomes realistas de escolas públicas brasileiras), 1 solicitante por escola, 8 categorias (Impressora, Rede/Internet, Computador, Projetor, Software, Periféricos, Telefonia, Outros), ~40 equipamentos e ~150 chamados nos últimos 6 meses com histórico COERENTE (gerar cada chamado simulando o fluxo de status em ordem cronológica; nada de RESOLVIDO sem técnico ou `resolvidoEm` antes de `abertoEm`). Alguns equipamentos devem concentrar mais defeitos para o dashboard ficar interessante. Senhas do seed documentadas no README.
**Pronto quando:** `npm run db:reset -w apps/api` (`prisma migrate reset` + `prisma db seed`; no Prisma 7 o reset não roda mais o seed sozinho) recria tudo e o seed roda sem erro.

### Fase 2 — Autenticação e permissões
API: login, logout, me, middlewares `autenticar` e `autorizar(...perfis)`, `AppError`, middleware de erro, middleware `validar(schema)`. Web: tela de login, `AuthContext`, `RotaProtegida` por perfil, layout com menu que muda por perfil.
**Pronto quando:** cada perfil do seed loga e vê só o menu permitido; rota proibida redireciona; testes de auth passam.

### Fase 3 — Cadastros (admin)
CRUD completo de escolas, usuários, categorias e equipamentos (API + telas com tabela paginada e formulário com validação). Página de detalhe do equipamento com a lista de chamados daquela máquina.
**Pronto quando:** admin gerencia tudo pela interface; patrimônio duplicado mostra erro amigável; soft delete funciona.

### Fase 4 — Chamados (núcleo)
Abertura, listagem com escopo por perfil, detalhe com linha do tempo do histórico, assumir, mudar status, comentar, resolver. Botões de ação aparecem conforme perfil e status atual. Tela "Minha fila" para técnico.
**Pronto quando:** fluxo completo funciona pela interface com os três perfis; histórico registra tudo; testes cobrem máquina de estados, escopo do solicitante, transação do histórico e conflito ao assumir.

### Fase 5 — Filtros e busca
Filtros da seção 7 na API e na tela de listagem. Estado dos filtros na URL (`useSearchParams`), busca com debounce de 300 ms, paginação.
**Pronto quando:** filtros combinam entre si, sobrevivem a F5 e ao botão voltar.

### Fase 6 — Dashboard
Endpoint da seção 7 + tela com cards de KPI, gráficos de barra (Recharts) por escola e por categoria, tabela dos equipamentos que mais quebram (com link para o detalhe) e filtro de período.
**Pronto quando:** números batem com o seed e mudam conforme o filtro.

### Fase 7 — Testes e CI
Completar testes prioritários da API e criar workflow do GitHub Actions (lint + typecheck + testes com Postgres como service).
**Pronto quando:** pipeline verde.

### Fase 8 — Deploy e README
Preparar para Render/Railway (build: `npm ci && npx prisma generate && npm run build`; start: `npx prisma migrate deploy && node dist/server.js`) e Vercel (`vercel.json` com rewrite de `/api/*` para a URL da API e fallback das demais rotas para `index.html`). Me guie passo a passo nas configurações que eu preciso fazer nos painéis.
README com: problema e contexto, screenshots, link do deploy, credenciais de teste por perfil, diagrama do banco, como rodar com Docker, decisões técnicas e trade-offs, aviso de cold start, e a seção "Próximos passos" (seção 9).

## 9. Fora do MVP (NÃO implementar; vai para "Próximos passos" no README)

- Notificação por e-mail
- Upload de foto do defeito
- App mobile
- Reabertura de chamado
- SLA por prioridade com alertas
- Tempo médio de resolução descontando o tempo em "Aguardando peça"
- Busca full-text com `tsvector`

## 10. Padrões de código

- Funções e componentes pequenos, nomes descritivos em português para o domínio.
- Nada de `any`. Tipos derivados do Prisma e do Zod (`z.infer`) sempre que possível.
- Datas em UTC no banco; formatação pt-BR (`dd/MM/yyyy HH:mm`) só no front.
- Front: toda chamada à API passa por `services/` e é consumida via TanStack Query; estados de loading, erro e lista vazia sempre tratados.
- UI em português, responsiva, acessível (labels em inputs, foco visível, contraste adequado). Cores de status consistentes em todo o app.
