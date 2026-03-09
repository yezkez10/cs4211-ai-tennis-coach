import { createRouter } from '@tanstack/react-router';

import { routeTree } from 'routeTree.gen';

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const initialRouterContext = {
  // auth will initially be undefined
  // We'll be passing down the auth state from within a React component
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  auth: undefined!,
};

export const router = createRouter({
  routeTree,
  context: initialRouterContext,
  scrollRestoration: true,
});

export type Router = typeof router;
