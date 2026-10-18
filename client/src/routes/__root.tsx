// src/routes/__root.tsx
import { ErrorBoundary } from 'react-error-boundary';

import ErrorAlert from '@/components/alerts/ErrorAlert';
import { Suspense } from 'react';

import LoadingAlert from '@/components/alerts/LoadingAlert';
import Layout from '@/components/layout/Layout';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RouterContext } from '@/router';
import {
  createRootRouteWithContext,
  Outlet,
  useMatches,
} from '@tanstack/react-router';
import { Toaster } from 'sonner';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  // The URL changes before pending routes finish loading. Keep the shell tied
  // to the rendered matches so the current page does not move into a new layout.
  const pathname = useMatches({
    select: (matches) => matches[matches.length - 1]?.pathname ?? '/',
  });
  const isVerifiedPage = new Set([
    '/login',
    '/signup',
    '/verify-email',
    '/password/forgot',
    '/password/reset',
    '/',
    '/home',
    '/landing',
  ]);

  const isEmailVerifyPage = pathname.startsWith('/email/verify/');
  const isQuestionnairePage = pathname.startsWith('/fragebogen/');
  const isDoorman =
    isVerifiedPage.has(pathname) || isEmailVerifyPage || isQuestionnairePage;

  if (isDoorman) {
    const isLanding = pathname === '/landing';
    return (
      <main
        className={
          isLanding ? 'h-dvh overflow-y-auto' : 'h-dvh overflow-hidden'
        }
      >
        <Outlet />
      </main>
    );
  }

  return (
    <SidebarProvider>
      <TooltipProvider>
        <ErrorBoundary fallback={<ErrorAlert />}>
          <Suspense fallback={<LoadingAlert fullScreen />}>
            <Toaster position="top-center" />
            <Layout />
          </Suspense>
        </ErrorBoundary>
      </TooltipProvider>
    </SidebarProvider>
  );
}
