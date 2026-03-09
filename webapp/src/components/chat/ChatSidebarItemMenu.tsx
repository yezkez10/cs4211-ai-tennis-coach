import { ActionIcon, Menu } from '@mantine/core';
import { IconDots, IconPencil, IconTrash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { client } from 'client';

interface Props {
  conversationId: number;
  onConversationReset: () => void;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ChatSidebarItemMenu({
  conversationId,
  onConversationReset,
  setIsEditing,
}: Props) {
  const queryClient = useQueryClient();

  const { mutate: deleteConversation } = useMutation({
    mutationFn: async () => {
      await client.api.conversation[':id'].$delete({
        param: { id: String(conversationId) },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onConversationReset();
    },
  });

  return (
    <Menu
      position="right"
      withArrow
      transitionProps={{ transition: 'pop-top-right' }}
    >
      <Menu.Target>
        <ActionIcon variant="subtle" onClick={(e) => e.preventDefault()}>
          <IconDots size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconPencil size={14} />}
          onClick={() => setIsEditing(true)}
        >
          Rename
        </Menu.Item>
        <Menu.Item
          leftSection={<IconTrash size={14} />}
          c="red"
          onClick={() => deleteConversation()}
        >
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
