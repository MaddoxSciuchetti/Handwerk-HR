// src/routes/__root.tsx
import { ErrorBoundary } from 'react-error-boundary';

import ErrorAlert from '@/components/alerts/ErrorAlert';
import { Suspense } from 'react';

import LoadingAlert from '@/components/alerts/LoadingAlert';
import Layout from '@/components/layout/Layout';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/context/theme-provider/ThemeContext';
import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router';
import { Toaster } from 'sonner';

export const Route = createRootRoute({
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
    '/',
  ]);

  const isDoorman = isVerifiedPage.has(location.pathname);

  if (isDoorman) {
    return (
      <main className="h-dvh overflow-hidden">
        <ThemeProvider>
          <Outlet />
        </ThemeProvider>
      </main>
    );
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <ErrorBoundary fallback={<ErrorAlert />}>
          <Suspense fallback={<LoadingAlert />}>
            <Toaster position="top-center" />
            <Layout />
          </Suspense>
        </ErrorBoundary>
      </SidebarProvider>
    </ThemeProvider>
  );
}
