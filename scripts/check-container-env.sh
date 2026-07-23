#!/bin/sh
# Safe env presence check inside a running Nest container (no secret values).
# Usage (from project with compose.yaml):
#   docker compose exec api-gateway sh scripts/check-container-env.sh
# Or copy this one-liner into Arcane exec if scripts/ is not in the image.

node -e "
const keys = [
  'NODE_ENV',
  'API_GATEWAY_PORT',
  'IDENTITY_SERVICE_PORT',
  'PLANT_SERVICE_PORT',
  'IDENTITY_SERVICE_HOST',
  'PLANT_SERVICE_HOST',
];
const flags = {
  hasJwtAccessSecret: Boolean(process.env.JWT_ACCESS_TOKEN_SECRET),
  hasJwtRefreshSecret: Boolean(process.env.JWT_REFRESH_TOKEN_SECRET),
  hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
  hasMongodbUri: Boolean(process.env.MONGODB_URI),
  hasRedisUrl: Boolean(process.env.REDIS_URL),
  hasRabbitmqHost: Boolean(process.env.RABBITMQ_HOST),
};
const summary = Object.fromEntries(keys.map((k) => [k, process.env[k] ?? null]));
console.log(JSON.stringify({ ...summary, ...flags }, null, 2));
"
