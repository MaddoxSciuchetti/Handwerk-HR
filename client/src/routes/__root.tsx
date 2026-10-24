// src/routes/__root.tsx
import { ErrorBoundary } from 'react-error-boundary';

import ErrorAlert from '@/components/alerts/ErrorAlert';
import { RouteError } from '@/components/alerts/RouteError';
import { Suspense } from 'react';

import LoadingAlert from '@/components/alerts/LoadingAlert';
import Layout from '@/components/layout/Layout';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RouterContext } from '@/router';
import {
  createRootRouteWithContext,
  Outlet,
  useLocation,
} from '@tanstack/react-router';
import { Toaster } from 'sonner';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  errorComponent: RouteError,
});

function RootLayout() {
  const location = useLocation();
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

  const isEmailVerifyPage = location.pathname.startsWith('/email/verify/');
  const isQuestionnairePage = location.pathname.startsWith('/fragebogen/');
  const isDoorman =
    isVerifiedPage.has(location.pathname) ||
    isEmailVerifyPage ||
    isQuestionnairePage;

  if (isDoorman) {
    const isLanding = location.pathname === '/landing';
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
