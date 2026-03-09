import dotenvx from '@dotenvx/dotenvx';
import { Config, defineConfig } from 'drizzle-kit';
import path from 'path';

const nodeEnv = process.env.NODE_ENV;

if (!nodeEnv || ['development', 'production'].includes(nodeEnv) === false) {
  console.error(
    `NODE_ENV must be set to either "development" or "production". Received: "${nodeEnv}"`,
  );
  process.exit(1);
}

const envPath =
  nodeEnv === 'production'
    ? path.resolve(process.cwd(), '.env.production')
    : `../.env.development`;

dotenvx.config({ path: [envPath] });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl === '') {
  console.error('DATABASE_URL must be set');
  process.exit(1);
}

const config: Config = defineConfig({
  out: './drizzle',
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  casing: 'snake_case',
});

export default config;
