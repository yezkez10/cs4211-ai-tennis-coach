import { createFileRoute } from '@tanstack/react-router';

import { Chat } from 'components/chat/Chat';

export const Route = createFileRoute('/_authenticated/chat')({
  component: () => <Chat />,
});
