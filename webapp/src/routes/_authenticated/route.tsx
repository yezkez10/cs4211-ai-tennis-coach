import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { isUserAuthenticated } from 'utils/auth';

export const Route = createFileRoute('/_authenticated')({
  component: () => <Outlet />,
  beforeLoad: () => {
    if (!isUserAuthenticated()) {
      throw redirect({ to: '/login', search: { redirect: location.pathname } });
    }
  },
});
