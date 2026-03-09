import { Button, PasswordInput, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';

import { type LoginFormSchema, loginFormSchema } from '@cs4211/common/schemas';

import { useLoginMutation } from 'hooks/useLoginMutation';

export function LoginForm() {
  const mutation = useLoginMutation();

  const form = useForm<LoginFormSchema>({
    mode: 'controlled',
    validate: zod4Resolver(loginFormSchema),
    initialValues: {
      email: '',
      password: '',
    },
  });

  return (
    <form onSubmit={form.onSubmit((data) => mutation.mutate(data))}>
      <Stack miw="25rem">
        <TextInput
          label="Email"
          withAsterisk
          {...form.getInputProps('email')}
        />
        <PasswordInput
          label="Password"
          withAsterisk
          {...form.getInputProps('password')}
        />
        <Button type="submit" loading={mutation.isPending}>
          Log In
        </Button>
      </Stack>
    </form>
  );
}
