// src/routes/__root.tsx
import Layout from '@/components/layout/Layout';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/context/theme-provider/ThemeContext';
import { createRootRoute, useLocation } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isSignUp = location.pathname === '/signup';
  const isVerfiy = location.pathname === '/verify-email';
  const isForgotPassword = location.pathname === '/password/forgot';
  const isResetPassword = location.pathname === '/password/reset';
  const isHomePage = location.pathname === '/';

  if (
    isLoginPage ||
    isSignUp ||
    isVerfiy ||
    isHomePage ||
    isResetPassword ||
    isForgotPassword
  ) {
    return (
      <main className="min-h-screen">
        <ThemeProvider>
          <Layout />
        </ThemeProvider>
      </main>
    );
  }

  return (
    <SidebarProvider>
      <ThemeProvider>
        <Layout />
      </ThemeProvider>
    </SidebarProvider>
  );
}
