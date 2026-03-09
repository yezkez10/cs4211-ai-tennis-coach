import { emailSchema } from './utils';
import { z } from 'zod';

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: 'Password is required' }),
});
export type LoginFormSchema = z.infer<typeof loginFormSchema>;
