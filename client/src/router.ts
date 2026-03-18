// src/router.ts
import queryClient from '@/config/query.client';
import { QueryClient } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export interface RouterContext {
  queryClient: QueryClient;
}

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  } as RouterContext,
});

export function AppRouter() {
  return RouterProvider({
    router,
    context: {
      queryClient,
    },
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
