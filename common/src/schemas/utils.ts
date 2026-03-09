import { z } from 'zod';

export const emailSchema = z
  .email({ error: 'Please enter a valid email' })
  .toLowerCase();
export type EmailSchema = z.infer<typeof emailSchema>;
