import { useMutation } from '@tanstack/react-query';

import { type LoginFormSchema } from '@cs4211/common/schemas';

import { client } from 'client';

export function useLoginMutation() {
  return useMutation<undefined, string, LoginFormSchema>({
    mutationFn: async (data: LoginFormSchema) => {
      const response = await client.api.auth.login.$post({ json: data });
      if (response.ok) {
        location.reload();
      }
    },
  });
}
