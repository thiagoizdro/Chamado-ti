# Chamados de TI

Sistema full stack para escolas de uma rede de ensino abrirem chamados de TI (impressora parada, PC sem internet, projetor com defeito). A equipe técnica assume, atende e registra a solução; a gestão acompanha indicadores num dashboard.

> Projeto em construção. Este README será completado na fase de deploy.

## Stack

- **API:** Node.js 24, TypeScript, Express 5, Prisma 7 (PostgreSQL 16), Zod
- **Web:** React 19, Vite, Tailwind CSS v4, React Router, TanStack Query, React Hook Form
- **Testes:** Vitest + Supertest
- **Infra local:** Docker Compose (`db`, `api` e `web`)

## Como rodar com Docker

Pré-requisito: Docker Desktop (no Windows, com WSL 2).

```bash
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:5173
- API: http://localhost:3333/api/health

O `.env.example` já funciona para desenvolvimento local. Em qualquer ambiente real, troque o `JWT_SECRET` por um valor aleatório (o comando para gerar está no próprio arquivo).

Na subida, a API aplica as migrations automaticamente (`prisma migrate deploy`). Para popular o banco com dados de exemplo:

```bash
docker compose exec api npm run db:seed
```

> Os `node_modules` ficam em volumes do container. Depois de mudar dependências, recrie os volumes com `docker compose up --build -V`.

## Como rodar sem Docker (só o banco no Docker)

```bash
cp .env.example .env
npm install
docker compose up -d db
npm run db:deploy -w apps/api
npm run db:seed -w apps/api
npm run dev -w apps/api   # API em http://localhost:3333
npm run dev -w apps/web   # Web em http://localhost:5173
```

## Dados de exemplo (seed)

O seed usa uma semente fixa e gera: 5 escolas, 8 categorias, 40 equipamentos e 150 chamados distribuídos nos últimos 6 meses, com histórico coerente (cada chamado percorre o fluxo de status em ordem cronológica). Alguns equipamentos concentram mais defeitos, e parte dos chamados recentes ainda está em andamento. As datas são calculadas a partir do momento em que o seed roda, então os dados são sempre "recentes"; os números exatos mudam um pouco de um dia para o outro.

Para recriar o banco do zero e rodar o seed:

```bash
npm run db:reset -w apps/api
```

### Credenciais de teste

Todos os usuários usam a senha **`Senha@123`**.

| Perfil      | E-mail                                 | Escola                              |
| ----------- | -------------------------------------- | ----------------------------------- |
| ADMIN       | `admin@chamados.dev`                   | —                                   |
| TECNICO     | `tecnico1@chamados.dev`                | —                                   |
| TECNICO     | `tecnico2@chamados.dev`                | —                                   |
| TECNICO     | `tecnico3@chamados.dev`                | —                                   |
| SOLICITANTE | `direcao.mariajose@chamados.dev`       | EMEF Professora Maria José da Silva |
| SOLICITANTE | `direcao.monteirolobato@chamados.dev`  | EMEF Monteiro Lobato                |
| SOLICITANTE | `direcao.ceciliameireles@chamados.dev` | EMEI Cecília Meireles               |
| SOLICITANTE | `direcao.paulofreire@chamados.dev`     | Escola Municipal Paulo Freire       |
| SOLICITANTE | `direcao.dompedro@chamados.dev`        | EMEF Dom Pedro II                   |

## Testes

Os testes da API usam um banco separado (`chamados_ti_test`), criado e migrado automaticamente na primeira execução. Só é preciso que o Postgres do Docker esteja rodando:

```bash
docker compose up -d db
npm test
```

Por segurança, os testes se recusam a rodar em um banco cujo nome não termine em `_test`.

## Scripts úteis

| Comando                          | O que faz                                |
| -------------------------------- | ---------------------------------------- |
| `npm run lint`                   | ESLint no monorepo                       |
| `npm run typecheck`              | TypeScript (api e web)                   |
| `npm test`                       | Testes da API (Vitest)                   |
| `npm run format`                 | Formata o código com Prettier            |
| `npm run db:migrate -w apps/api` | Cria/aplica migration em desenvolvimento |
| `npm run db:seed -w apps/api`    | Popula o banco com os dados de exemplo   |
| `npm run db:reset -w apps/api`   | Recria o banco do zero e roda o seed     |
