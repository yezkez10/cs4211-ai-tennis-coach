import { z } from 'zod';

interface JWTPayload {
  [key: string]: unknown;
  exp?: number;
  nbf?: number;
  iat?: number;
}

export const userJwtPayloadSchema = z.object({
  userId: z.number(),
});
export type UserJwtPayloadSchema = z.infer<typeof userJwtPayloadSchema> &
  JWTPayload;
