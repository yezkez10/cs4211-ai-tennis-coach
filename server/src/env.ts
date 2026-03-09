import dotenvx from '@dotenvx/dotenvx';
import path from 'path';

import { validateEnvVars } from 'utils/env';

// We allow access to process.env to manually validate env vars
// eslint-disable-next-line no-restricted-syntax
const nodeEnv = process.env.NODE_ENV;

if (!nodeEnv || ['development', 'production'].includes(nodeEnv) === false) {
  console.error(
    `NODE_ENV must be set to either "development" or "production". Received: "${nodeEnv}"`,
  );
  process.exit(1);
}

const envPath =
  nodeEnv === 'production'
    ? path.resolve(__dirname, '.env.production')
    : `../.env.development`;

dotenvx.config({ path: [envPath] });

export const ENV_VARS = validateEnvVars();
