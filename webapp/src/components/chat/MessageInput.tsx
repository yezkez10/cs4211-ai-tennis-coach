import { useState } from 'react';

import { ActionIcon, Group, Paper, Stack, Textarea } from '@mantine/core';
import { IconPlayerStop, IconSend } from '@tabler/icons-react';

import { type NonNullableUseGetConversationData } from 'hooks/useGetConversation';
import { TEMP_ID } from 'hooks/useStreamingMessages';

interface Args {
  canAbort: boolean;
  onSend: (content: NonNullableUseGetConversationData[number]) => void;
  abortStream: () => void;
}

export function MessageInput({ canAbort, onSend, abortStream }: Args) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() === '') return;

    onSend({
      id: TEMP_ID,
      createdAt: new Date().toISOString(),
      parentMessageId: null,
      role: 'user',
      content: message,
    });
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!canAbort && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper withBorder p="md">
      <Stack gap={0}>
        <Textarea
          placeholder="Type your message..."
          variant="unstyled"
          autosize
          minRows={1}
          maxRows={6}
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <Group justify="flex-end">
          <ActionIcon
            onClick={canAbort ? abortStream : handleSend}
            variant="light"
            size="lg"
            radius="xl"
          >
            {canAbort ? <IconPlayerStop size={18} /> : <IconSend size={18} />}
          </ActionIcon>
        </Group>
      </Stack>
    </Paper>
  );
}
