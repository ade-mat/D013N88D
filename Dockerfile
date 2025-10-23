# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY client/package.json client/
COPY server/package.json server/

RUN npm install

COPY . .

RUN npm run build --prefix client \
  && npm run build --prefix server \
  && mkdir -p dist/client \
  && cp -r client/dist/. dist/client/


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

RUN npm prune --omit=dev

EXPOSE 8080

CMD ["node", "dist/server/src/index.js"]
