import { ENV_VARS } from 'env';

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { deleteCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';

import { DEFAULT_ERROR_MESSAGE, USER_COOKIE_NAME } from '@cs4211/common/const';

import { devMiddleware } from 'middlewares/dev';

import { authApp } from 'routes/auth';

const { PORT, NODE_ENV } = ENV_VARS;
const servePort = parseInt(PORT, 10);

const apiRoutes = new Hono()
  .get('/health', (c) => {
    return c.json({ message: 'healthy!', NODE_ENV });
  })
  .route('/auth', authApp);

const app = new Hono();
const _route = app
  .use(logger())
  .use(devMiddleware())
  .route('/api', apiRoutes)
  .onError((err, c) => {
    if (err instanceof HTTPException) {
      if (err.status === 401) {
        deleteCookie(c, USER_COOKIE_NAME);
        return c.json({ message: 'Unauthorized.' }, 401);
      }

      if (err.status === 404) {
        return c.json({ message: err.message, data: null }, 404);
      }

      const errorMessage = err.message || DEFAULT_ERROR_MESSAGE;

      return c.json({ message: errorMessage }, err.status);
    }

    console.error(err);

    return c.json({ message: DEFAULT_ERROR_MESSAGE }, 500);
  });

// eslint-disable-next-line no-console
console.log(`Server is running on http://localhost:${servePort}`);
serve({
  fetch: app.fetch,
  port: servePort,
});

export type AppType = typeof _route;
