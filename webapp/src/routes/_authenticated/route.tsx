import { Card, Flex } from '@mantine/core';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { isUserAuthenticated } from 'utils/auth';

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
  beforeLoad: () => {
    if (!isUserAuthenticated()) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.pathname,
        },
      });
    }
  },
});

function RouteComponent() {
  return (
    <Flex gap="0" w="100vw" mih="100vh">
      <Card bg="gray.1" w="100%" radius="0" px="xl" pb="xl" pt="lg">
        <Outlet />
      </Card>
    </Flex>
  );
}
