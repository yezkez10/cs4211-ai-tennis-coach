import { Box, Card, Text } from '@mantine/core';

import { type NonNullableUseGetConversationData } from 'hooks/useGetConversation';

interface Props {
  message: NonNullableUseGetConversationData[number];
}

export function MessageBubble({ message }: Props) {
  const { content, role } = message;

  if (role === 'user') {
    return (
      <Card
        maw="75%"
        bg="blue"
        c="white"
        ml="auto"
        style={{ alignSelf: 'flex-end' }}
      >
        <Text fz="lg" style={{ whiteSpace: 'pre-wrap' }}>
          {content}
        </Text>
      </Card>
    );
  }

  return (
    <Box w="100%" fz="lg" style={{ whiteSpace: 'pre-wrap' }}>
      {content}
    </Box>
  );
}
