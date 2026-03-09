import { Group, Text } from '@mantine/core';

import { ChatSidebarItemMenu } from 'components/chat/ChatSidebarItemMenu';

interface Props {
  title: string;
  conversationId: number;
  onConversationReset: () => void;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ChatSidebarItemTitle({
  title,
  conversationId,
  onConversationReset,
  setIsEditing,
}: Props) {
  return (
    <Group
      justify="space-between"
      w="100%"
      wrap="nowrap"
      onDoubleClick={() => setIsEditing(true)}
    >
      <Text truncate="end">{title}</Text>
      <ChatSidebarItemMenu
        conversationId={conversationId}
        onConversationReset={onConversationReset}
        setIsEditing={setIsEditing}
      />
    </Group>
  );
}
