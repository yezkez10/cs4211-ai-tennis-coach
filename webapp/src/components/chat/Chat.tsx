import { useState } from 'react';

import { ActionIcon, Box, Group, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarRightCollapse,
} from '@tabler/icons-react';

import { ChatBody } from 'components/chat/ChatBody';
import { ChatSidebar } from 'components/chat/ChatSidebar';

const NAVBAR_WIDTH = rem(300);

export function Chat() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isSidebarOpen, { toggle: toggleSidebar }] = useDisclosure(true);

  return (
    <Group h="100dvh" style={{ overflow: 'hidden' }} gap={0}>
      <Box
        h="100%"
        w={isSidebarOpen ? NAVBAR_WIDTH : 0}
        opacity={isSidebarOpen ? 1 : 0}
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'width 300ms ease, opacity 150ms ease 100ms',
          borderRight: isSidebarOpen ? '1px solid #e0e0e0' : 'none',
        }}
      >
        <ChatSidebar
          conversationId={conversationId}
          onConversationSelected={setConversationId}
          onConversationReset={() => setConversationId(null)}
        />
      </Box>
      <Box flex={1} h="100%" pos="relative">
        <Group pos="absolute" top={0} h="70px" w="100%">
          <ActionIcon
            onClick={toggleSidebar}
            size={rem(36)}
            m="md"
            variant="light"
          >
            {isSidebarOpen ? (
              <IconLayoutSidebarLeftCollapse />
            ) : (
              <IconLayoutSidebarRightCollapse />
            )}
          </ActionIcon>
        </Group>
        <Box h="100%" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
          <ChatBody
            conversationId={conversationId}
            onConversationCreated={setConversationId}
          />
        </Box>
      </Box>
    </Group>
  );
}
