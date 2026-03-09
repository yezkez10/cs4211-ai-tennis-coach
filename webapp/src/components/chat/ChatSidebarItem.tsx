import { useState } from 'react';

import { Group, rem, useMantineTheme } from '@mantine/core';
import { useHover } from '@mantine/hooks';

import { ChatSidebarItemInput } from 'components/chat/ChatSidebarItemInput';
import { ChatSidebarItemTitle } from 'components/chat/ChatSidebarItemTitle';

import { type UseGetConversationsData } from 'hooks/useGetConversations';

interface Props {
  isSelected: boolean;
  conversation: UseGetConversationsData[number];
  onConversationReset: () => void;
  onConversationSelected: (conversationId: number) => void;
}

export function ChatSidebarItem({
  isSelected,
  conversation,
  onConversationReset,
  onConversationSelected,
}: Props) {
  const { ref, hovered } = useHover();
  const theme = useMantineTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title ?? '');

  return (
    <Group
      ref={ref}
      h={rem(40)}
      px={isEditing ? 0 : 'sm'}
      style={{
        borderRadius: theme.radius.md,
        backgroundColor: isSelected
          ? theme.colors.gray[3]
          : hovered
            ? theme.colors.gray[1]
            : undefined,
      }}
      onClick={() => onConversationSelected(conversation.id)}
    >
      {isEditing ? (
        <ChatSidebarItemInput
          conversationId={conversation.id}
          title={title}
          setIsEditing={setIsEditing}
          handleEdit={setTitle}
        />
      ) : (
        <ChatSidebarItemTitle
          conversationId={conversation.id}
          title={title}
          setIsEditing={setIsEditing}
          onConversationReset={onConversationReset}
        />
      )}
    </Group>
  );
}
