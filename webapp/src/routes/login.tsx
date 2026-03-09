import { Stack, Title } from '@mantine/core';
import { createFileRoute, redirect } from '@tanstack/react-router';
import z from 'zod';

import { LoginForm } from 'components/auth/LoginForm';

import { isUserAuthenticated } from 'utils/auth';

export const Route = createFileRoute('/login')({
  component: Component,
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  beforeLoad: ({ search }) => {
    if (isUserAuthenticated()) {
      throw redirect({ to: search.redirect ?? '/chat' });
    }
  },
});

function Component() {
  return (
    <Stack mih="100vh" align="center" justify="center" gap="xl">
      <Stack gap="xs">
        <Title fw="normal" ta="center">
          CS4211
        </Title>
      </Stack>
      <LoginForm />
    </Stack>
  );
}
