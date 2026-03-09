import { useQuery } from '@tanstack/react-query';

import { client } from 'client';

export function useGetConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await client.api.conversation.$get();
      const responseJson = await response.json();
      return responseJson.data;
    },
  });
}

export type UseGetConversationsData = NonNullable<
  ReturnType<typeof useGetConversations>['data']
>;
