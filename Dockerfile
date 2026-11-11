# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig.json tsconfig.node.json ./
COPY src src
COPY static static

RUN npm run build

FROM nginx:1.27-alpine AS web

ENV SERVER_UPSTREAM=server:8765

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/public /usr/share/nginx/html/dashboard

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O- http://127.0.0.1/health | grep -q '"ok":true' || exit 1
