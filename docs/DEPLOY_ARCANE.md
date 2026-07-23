# Triển khai OrchidPal với Arcane

Source of truth: thư mục **`docker/`** ở root monorepo.

```text
docker/
  infra/   ← Postgres, Redis, Mongo, RabbitMQ, Mosquitto
  apps/    ← NestJS api-gateway, identity, plant
  web/     ← Frontend Next.js
```

Chi tiết: [`docker/README.md`](../../docker/README.md)

## Thứ tự deploy Arcane

1. **infra** — dán `docker/infra/compose.yaml` + `.env`
2. **apps** — dán `docker/apps/compose.yaml` + `.env` (`DOCKER_USERNAME=kietmn`, `PULL_POLICY=always`)
3. **web** — dán `docker/web/compose.yaml` + `.env`

## Build / push BE images

```bash
cd orchid-pal-be
docker login
export DOCKER_USERNAME=kietmn
export IMAGE_TAG=latest
npm run docker:release
```

## Local apps

```bash
cd docker/apps
# .env: PULL_POLICY=never
docker compose up -d
```

Swagger: http://localhost:3000/docs

`orchid-pal-be/compose.yaml` đồng bộ với `docker/apps/compose.yaml` (tham khảo).
