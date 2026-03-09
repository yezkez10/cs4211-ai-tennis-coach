import { ENV_VARS } from 'env';

import { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from 'db/schema';
import { relations } from 'db/schema/relations';

const { DATABASE_URL } = ENV_VARS;

export const db = drizzle({
  connection: {
    connectionString: DATABASE_URL,
    ssl: false,
  },
  schema,
  relations,
  casing: 'snake_case',
});

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
