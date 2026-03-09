import { ENV_VARS } from 'env';

import { createMiddleware } from 'hono/factory';

interface Args {
  delayMilliseconds?: number;
}

const { NODE_ENV } = ENV_VARS;

export function devMiddleware({ delayMilliseconds = 100 }: Args = {}) {
  return createMiddleware(async (_c, next) => {
    if (NODE_ENV !== 'development') {
      return await next();
    }

    await new Promise((resolve) => setTimeout(resolve, delayMilliseconds));
    await next();
  });
}
