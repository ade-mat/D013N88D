# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

ENV VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
ENV VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}
ENV VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
ENV VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}
ENV VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}

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
RUN addgroup -S ember && adduser -S ember -G ember

COPY --from=builder --chown=ember:ember /app/package.json ./package.json
COPY --from=builder --chown=ember:ember /app/node_modules ./node_modules
COPY --from=builder --chown=ember:ember /app/dist ./dist
COPY --from=builder --chown=ember:ember /app/client/dist ./client/dist

EXPOSE 8080
USER ember
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["sh", "-c", "wget -q -O /dev/null \"http://127.0.0.1:${PORT:-8080}/api/health\" || exit 1"]

CMD ["node", "dist/server/src/index.js"]
