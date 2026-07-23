# syntax=docker/dockerfile:1.7
#
# Multi-stage production image for NestJS monorepo apps:
#   api-gateway | identity-service | plant-service
#
# Build:
#   docker build --build-arg APP_NAME=api-gateway -t orchidpal-api-gateway:latest .
#
# Secrets must be injected at runtime (Compose/Arcane environment), never as ARG/ENV.

ARG NODE_VERSION=22-alpine

# ── dependencies ─────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ── build ────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

ARG APP_NAME
RUN test -n "$APP_NAME" || (echo "APP_NAME build-arg is required" && exit 1)

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json nest-cli.json tsconfig.json tsconfig.build.json ./
COPY apps ./apps
COPY libs ./libs

# Prisma client (native engines) needed at runtime for all apps using PrismaModule
RUN npx prisma generate --schema=./libs/prisma/prisma/schema.prisma

RUN npx nest build "${APP_NAME}"

# Keep prod node_modules + generated Prisma engines
RUN npm prune --omit=dev && npm cache clean --force

# ── runtime ──────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ARG APP_NAME
RUN test -n "$APP_NAME" || (echo "APP_NAME build-arg is required" && exit 1)

ENV NODE_ENV=production
ENV APP_NAME=${APP_NAME}

RUN addgroup -S nestjs && adduser -S nestjs -G nestjs

COPY --from=builder --chown=nestjs:nestjs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/dist ./dist
# gRPC proto paths are resolved from process.cwd()/libs/grpc/proto
COPY --from=builder --chown=nestjs:nestjs /app/libs/grpc/proto ./libs/grpc/proto
COPY --from=builder --chown=nestjs:nestjs /app/libs/prisma/prisma ./libs/prisma/prisma

USER nestjs

# Exec form via shell so $APP_NAME expands and Node receives SIGTERM
CMD ["sh", "-c", "exec node dist/apps/${APP_NAME}/main"]
