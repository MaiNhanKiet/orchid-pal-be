import { ConfigModuleOptions } from '@nestjs/config';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Shared ConfigModule options for all apps.
 * - Development: load root `.env` (dotenv does not override existing process.env).
 * - Production: ignore env files; rely on Docker/Arcane-injected process.env.
 */
export const appConfig: ConfigModuleOptions = {
  isGlobal: true,
  cache: true,
  ignoreEnvFile: isProduction,
  envFilePath: isProduction ? undefined : '.env',
};
