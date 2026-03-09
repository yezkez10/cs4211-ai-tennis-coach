import { TextInput } from '@mantine/core';
import { useClickOutside } from '@mantine/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { client } from 'client';

interface Props {
  conversationId: number;
  title: string;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  handleEdit: (title: string) => void;
}

export function ChatSidebarItemInput({
  conversationId,
  title,
  setIsEditing,
  handleEdit,
}: Props) {
  const queryClient = useQueryClient();
  const ref = useClickOutside(() => setIsEditing(false));

  const { mutate: rename } = useMutation({
    mutationFn: async (title: string) => {
      await client.api.conversation[':conversationId'].$put({
        param: { conversationId: String(conversationId) },
        json: { title },
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  return (
    <TextInput
      ref={ref}
      value={title}
      autoFocus
      size="sm"
      w="100%"
      onChange={(e) => handleEdit(e.currentTarget.value)}
      onBlur={(e) => rename(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          setIsEditing(false);
          rename(e.currentTarget.value);
        }
      }}
    />
  );
}
