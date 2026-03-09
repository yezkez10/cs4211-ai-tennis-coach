import { Button } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

import { endUserSession } from 'utils/auth';

export const Route = createFileRoute('/_authenticated/chat')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Button onClick={endUserSession}>Logout</Button>;
}
