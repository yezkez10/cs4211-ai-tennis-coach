import { Button, Skeleton, Stack, rem } from '@mantine/core';

import { ChatSidebarItem } from 'components/chat/ChatSidebarItem';

import { useGetConversations } from 'hooks/useGetConversations';

import { endUserSession } from 'utils/auth';

interface Props {
  conversationId: number | null;
  onConversationReset: () => void;
  onConversationSelected: (conversationId: number) => void;
}

export function ChatSidebar({
  conversationId,
  onConversationReset,
  onConversationSelected,
}: Props) {
  const { data: conversations = [], isLoading } = useGetConversations();

  return (
    <Stack p="md" h="100%">
      <Button onClick={onConversationReset}>New Chat</Button>
      <Stack gap={rem(4)}>
        {isLoading
          ? Array.from({ length: 15 }).map((_, index) => (
              <Skeleton key={index} height={rem(32)} radius="md" />
            ))
          : conversations.map((conversation) => (
              <ChatSidebarItem
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === conversationId}
                onConversationReset={onConversationReset}
                onConversationSelected={onConversationSelected}
              />
            ))}
      </Stack>
      <Button onClick={endUserSession} variant="outline" color="red" mt="auto">
        Logout
      </Button>
    </Stack>
  );
}
