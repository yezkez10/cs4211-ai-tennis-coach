// Only this file is allowed to import zValidator from @hono/zod-validator
// This is a controlled wrapper around zValidator to ensure that server-side validation errors is not exposed to the client.
// eslint-disable-next-line no-restricted-imports
import { zValidator } from '@hono/zod-validator';
import { type Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const zodValidator = <
  Target extends Parameters<typeof zValidator>[0],
  Schema extends Parameters<typeof zValidator>[1],
>(
  target: Target,
  schema: Schema,
) => {
  return zValidator(target, schema, (result, c: Context) => {
    if (!result.success) {
      console.error(
        'Request Validation error:',
        JSON.stringify(
          {
            endpoint: `${c.req.method} ${c.req.path}`,
            result,
          },
          null,
          2,
        ),
      );
      throw new HTTPException(400);
    }
  });
};
