# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
# A recolha de dados das páginas abre a base de dados; aponta-a para fora de
# /app para que nenhum ficheiro .db acabe dentro da imagem.
ENV NEXT_TELEMETRY_DISABLED=1 \
    CRM_DB_PATH=/tmp/crm-build.db
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    CRM_DB_PATH=/data/crm.db

# Saída autónoma: o servidor e só as dependências que ele usa.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# Scripts de administração (criar contas, dados de demonstração) e os módulos
# que importam. O standalone não os inclui, mas são precisos para o
# `docker exec ... npm run criar-utilizador` depois do arranque.
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/src/lib/db.ts ./src/lib/db.ts
COPY --from=build /app/src/lib/palavra-passe.ts ./src/lib/palavra-passe.ts

# A base de dados vive no volume persistente montado em /data.
RUN mkdir -p /data && chown -R node:node /data /app
USER node
VOLUME ["/data"]
EXPOSE 3000

CMD ["node", "server.js"]
