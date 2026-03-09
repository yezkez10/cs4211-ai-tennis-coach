import { StrictMode } from 'react';

import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { DatesProvider } from '@mantine/dates';
import '@mantine/dates/styles.css';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from '@tanstack/react-router';

import { router } from 'router';
import { theme } from 'theme';

export function App() {
  const queryClient = new QueryClient();

  return (
    <StrictMode>
      <MantineProvider theme={theme}>
        <DatesProvider
          settings={{
            locale: 'en-SG',
            firstDayOfWeek: 1,
            weekendDays: [0, 6],
          }}
        >
          <Notifications position="top-right" />
          <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools initialIsOpen={false} />
            <RouterProvider router={router} />
          </QueryClientProvider>
        </DatesProvider>
      </MantineProvider>
    </StrictMode>
  );
}
