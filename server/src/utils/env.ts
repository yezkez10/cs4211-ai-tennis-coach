/* eslint-disable no-console */
import chalk from 'chalk';

const nodeEnvs = ['production', 'development'] as const;
export type NodeEnv = (typeof nodeEnvs)[number];

// Should match the keys in the .env.example file
const envKeys = [
  'JWT_SECRET',
  'PORT',
  'DATABASE_URL',
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
] as const;

export type EnvKeys = (typeof envKeys)[number];

export function validateEnvVars() {
  const seenKeys = new Set();
  const duplicateKeys = new Set();

  for (const key of envKeys) {
    if (seenKeys.has(key)) {
      duplicateKeys.add(key);
    } else {
      seenKeys.add(key);
    }
  }

  if (duplicateKeys.size > 0) {
    throw new Error(
      chalk.red(
        `Duplicate keys found in environment variables input: ${Array.from(
          duplicateKeys,
        ).join(', ')}`,
      ),
    );
  }

  const validatedVarsRaw: Partial<Record<EnvKeys, string>> = {};
  let nodeEnvValidated: NodeEnv | undefined;
  let hasMissingKey = false;

  // It is okay to access process.env here because we are checking for the existence of the keys
  // eslint-disable-next-line no-restricted-syntax
  const nodeEnv = process.env.NODE_ENV;
  if (!nodeEnv) {
    console.error(chalk.red('Environment variable missing: NODE_ENV'));

    hasMissingKey = true;
  } else if (!isNodeEnv(nodeEnv)) {
    console.error(
      chalk.red(
        `NODE_ENV must be either 'production' or 'development'. Received: ${nodeEnv}`,
      ),
    );
    hasMissingKey = true;
  } else {
    nodeEnvValidated = nodeEnv;
  }

  for (const key of envKeys) {
    // It is okay to access process.env here because we are checking for the existence of the keys
    // eslint-disable-next-line no-restricted-syntax
    const envVar = process.env[key];
    if (!envVar) {
      console.error(`Environment variable missing: ${chalk.red(key)}`);
      hasMissingKey = true;
    } else {
      validatedVarsRaw[key] = envVar;
    }
  }

  if (hasMissingKey || !nodeEnvValidated) {
    console.error(
      chalk.red(
        `Missing some environment variables :( Look at the example files again.`,
      ),
    );
    process.exit(1);
  }

  console.log(
    chalk.green(
      `${envKeys.length + 1} environment variables successfully validated (including NODE_ENV).`,
    ),
  );

  return {
    ...(validatedVarsRaw as Record<EnvKeys, string>), // Safe cast because we checked all keys
    NODE_ENV: nodeEnvValidated,
  };
}

function isNodeEnv(value: string): value is NodeEnv {
  return nodeEnvs.some((env) => env === value);
}
