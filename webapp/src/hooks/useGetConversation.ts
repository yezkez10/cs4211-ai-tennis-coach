import { useQuery } from '@tanstack/react-query';

import { client } from 'client';

export function useGetConversation(conversationId: number | null) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (conversationId == null) {
        return null;
      }
      const response = await client.api.conversation[':conversationId'].$get({
        param: { conversationId: String(conversationId) },
      });
      const responseJson = await response.json();
      return responseJson.data;
    },
  });
}

type UseGetConversationData = ReturnType<typeof useGetConversation>['data'];
export type NonNullableUseGetConversationData =
  NonNullable<UseGetConversationData>;
