# Contexto de build: raiz do monorepo (ver docker-compose.yml).

# ---------- base: manifestos e dependências ----------
FROM node:24-alpine AS base
# Fixamos o Prisma 7; o aviso de update do CLI aponta para um RC da v8.
ENV PRISMA_HIDE_UPDATE_MESSAGE=true
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

# ---------- dev: usado pelo Compose (código entra por volume) ----------
FROM base AS dev
ENV NODE_ENV=development
RUN npm ci
WORKDIR /app/apps/api
EXPOSE 3333
CMD ["sh", "-c", "npm run db:generate && npm run db:deploy && npm run dev"]

# ---------- build: compila o TypeScript ----------
FROM base AS build
RUN npm ci
COPY tsconfig.base.json ./
COPY apps/api apps/api
WORKDIR /app/apps/api
# O generate não conecta no banco, mas o prisma.config.ts exige a variável.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm run db:generate \
  && npm run build

# ---------- prod: só dependências de runtime + código compilado ----------
FROM base AS prod
ENV NODE_ENV=production
RUN npm ci --omit=dev --workspace apps/api && npm cache clean --force
WORKDIR /app/apps/api
COPY apps/api/prisma.config.ts ./
COPY apps/api/prisma ./prisma
COPY --from=build /app/apps/api/dist ./dist
USER node
EXPOSE 3333
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
