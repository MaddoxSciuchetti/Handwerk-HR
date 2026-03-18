// src/router.ts
import { createRouter } from '@tanstack/react-router';
import { User } from './features/user-profile/types/auth.type';
import { routeTree } from './routeTree.gen';

export interface RouterContext {
  auth: {
    isAuthenticated: boolean;
    user: User | null;
  };
}

export const router = createRouter({
  routeTree,
  context: {
    auth: {
      isAuthenticated: false,
      user: null,
    },
  } as RouterContext,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
