import { createFileRoute } from '@tanstack/react-router';

import { router } from 'router';

export const Route = createFileRoute('/')({
  beforeLoad: () => router.navigate({ to: '/chat' }),
  component: Component,
});

function Component() {
  return <></>;
}
