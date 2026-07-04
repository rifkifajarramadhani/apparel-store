# syntax=docker/dockerfile:1
FROM oven/bun:1 AS base
WORKDIR /app

# --- dev: Vite dev server with hot reload (source is bind-mounted by compose) ---
FROM base AS dev
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
EXPOSE 3000
CMD ["bun", "run", "dev", "--", "--host"]

# --- build: produce dist/client + dist/server/server.js ---
FROM base AS build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# VITE_* vars are baked into the client bundle at build time.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN bun run build

# --- prod: serve SSR handler with Bun ---
FROM base AS prod
ENV NODE_ENV=production
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY --from=build /app/dist ./dist
COPY server.ts ./
EXPOSE 3000
CMD ["bun", "server.ts"]
