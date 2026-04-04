// src/routes/__root.tsx
import { ErrorBoundary } from 'react-error-boundary';

import ErrorAlert from '@/components/alerts/ErrorAlert';
import { Suspense } from 'react';

import LoadingAlert from '@/components/alerts/LoadingAlert';
import Layout from '@/components/layout/Layout';
import { SidebarProvider } from '@/components/ui/sidebar';
import { RouterContext } from '@/router';
import {
  createRootRouteWithContext,
  Outlet,
  useLocation,
} from '@tanstack/react-router';
import { Toaster } from 'sonner';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  const location = useLocation();
  const isVerifiedPage = new Set([
    '/login',
    '/signup',
    '/verify-email',
    '/password/forgot',
    '/password/reset',
    '/register-org',
    '/',
    '/home',
  ]);

  const isEmailVerifyPage = location.pathname.startsWith('/email/verify/');
  const isDoorman = isVerifiedPage.has(location.pathname) || isEmailVerifyPage;

  if (isDoorman) {
    return (
      <main className="h-dvh overflow-hidden">
        <Outlet />
      </main>
    );
  }

  return (
    <SidebarProvider>
      <ErrorBoundary fallback={<ErrorAlert />}>
        <Suspense fallback={<LoadingAlert fullScreen />}>
          <Toaster position="top-center" />
          <Layout />
        </Suspense>
      </ErrorBoundary>
    </SidebarProvider>
  );
}
