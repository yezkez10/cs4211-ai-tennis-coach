import { ENV_VARS } from 'env';

import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { verify } from 'hono/jwt';

import { USER_COOKIE_NAME } from '@cs4211/common/const';
import {
  type UserJwtPayloadSchema,
  userJwtPayloadSchema,
} from '@cs4211/common/schemas';

const { JWT_SECRET } = ENV_VARS;

export function authMiddleware() {
  return createMiddleware<{
    Variables: {
      userJwtPayload: UserJwtPayloadSchema;
    };
  }>(async (c, next) => {
    const jwtToken = getCookie(c, USER_COOKIE_NAME);

    if (!jwtToken) {
      console.error('JWT token not found in cookie.');
      throw new HTTPException(401);
    }

    let userJwtPayload: UserJwtPayloadSchema;

    try {
      const rawJwtPayload = await verify(jwtToken, JWT_SECRET, {
        alg: 'HS256',
      });
      userJwtPayload = userJwtPayloadSchema.parse(rawJwtPayload);
    } catch (error) {
      console.error('Error verifying JWT token:', error);
      throw new HTTPException(401);
    }

    c.set('userJwtPayload', userJwtPayload);

    await next();
  });
}
