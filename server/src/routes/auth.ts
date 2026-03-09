import { ENV_VARS } from 'env';

import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { sign as signJwt } from 'hono/jwt';
import { z } from 'zod';

import { USER_COOKIE_NAME } from '@cs4211/common/const';

import { db } from 'db/index';
import { user } from 'db/schema';

import { zodValidator } from 'middlewares/zodValidator';

const { JWT_SECRET } = ENV_VARS;

const JWT_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const authApp = new Hono().post(
  '/login',
  zodValidator('json', loginSchema),
  async (c) => {
    const { email, password } = c.req.valid('json');

    const [existingUser] = await db
      .select({ id: user.id, password: user.password })
      .from(user)
      .where(eq(user.email, email));

    const dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$placeholder';
    const passwordValid = existingUser
      ? await argon2.verify(existingUser.password, password)
      : (await argon2.verify(dummyHash, password).catch(() => false), false);

    if (!existingUser || !passwordValid) {
      throw new HTTPException(400, { message: 'Invalid email or password.' });
    }

    const payload = {
      userId: existingUser.id,
      exp: Math.floor(Date.now() / 1000) + JWT_TOKEN_EXPIRY_SECONDS,
    };

    const token = await signJwt(payload, JWT_SECRET);

    setCookie(c, USER_COOKIE_NAME, token, {
      secure: true,
      sameSite: 'Lax',
      maxAge: JWT_TOKEN_EXPIRY_SECONDS,
    });

    return c.json({});
  },
);
