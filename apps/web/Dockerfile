# Imagem só para desenvolvimento: em produção o front vai para a Vercel.
# Contexto de build: raiz do monorepo (ver docker-compose.yml).
FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci
WORKDIR /app/apps/web
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
