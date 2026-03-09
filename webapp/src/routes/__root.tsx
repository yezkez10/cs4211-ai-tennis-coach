import { Box } from '@mantine/core';
import { Outlet, createRootRoute } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: Component,
});

function Component() {
  return (
    <Box component="main">
      <Outlet />
    </Box>
  );
}
