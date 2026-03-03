// src/routes/__root.tsx
import Layout from '@/components/layout/Layout';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/context/theme-provider/ThemeContext';
import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router';

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
      <main className="min-h-screen">
        <ThemeProvider>
          <Outlet />
        </ThemeProvider>
      </main>
    );
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <Layout />
      </SidebarProvider>
    </ThemeProvider>
  );
}
