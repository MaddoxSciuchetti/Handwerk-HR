import { useBillingSubscription } from '@/features/settings/payments/hooks/useBillingSubscription';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { isSubscriptionLocked } from '@/features/settings/payments/util/subscriptionAccess.util';
import { MentionNotice } from '@/features/all-tasks/components/MentionNotice';
import { useThemeProvider } from '@/hooks/useThemeProvider';
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import AppSidebar from '../ui/sidebar/AppSidebar';
import {
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import PagePath from './headers/PagePath';
import { SettingsSidebar } from './SettingsSidebar';

function Layout() {
  const { theme } = useThemeProvider();
  const [isSettingOpen, setIsSettingOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.membershipRole === 'admin';
  const { data: subscription, isFetched, isError } = useBillingSubscription();

  const subscriptionLocked = useMemo(
    () =>
      isFetched && !isError && isSubscriptionLocked(subscription ?? undefined),
    [isFetched, isError, subscription]
  );

  useEffect(() => {
    if (
      location.pathname.startsWith('/settings') ||
      location.pathname === '/bestand'
    ) {
      setIsSettingOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!subscriptionLocked || !isAdmin) return;
    const path = location.pathname;
    if (path === '/settings/payments' || path === '/settings/plans') return;
    navigate({ to: '/settings/payments' });
    setIsSettingOpen(true);
  }, [subscriptionLocked, isAdmin, location.pathname, navigate]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
      {isSettingOpen ? (
        <SettingsSidebar
          subscriptionLocked={subscriptionLocked}
          setIsSettingOpen={setIsSettingOpen}
        />
      ) : (
        <AppSidebar
          subscriptionLocked={subscriptionLocked}
          setIsSettingOpen={setIsSettingOpen}
        />
      )}
      <SidebarInset className="mt-1 mb-1 ml-1 flex h-[calc(100svh-0.5rem)] grow flex-col overflow-hidden rounded-[26px] border border-border bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <PagePath />
        </header>
        <main className="flex min-h-0 grow flex-col gap-4 bg-background p-4 lg:items-center">
          <div className="h-full w-full min-h-0 min-w-0 grow overflow-hidden">
            {subscriptionLocked && !isAdmin ? (
              <div className="flex h-full items-center justify-center rounded-2xl bg-card p-6 text-card-foreground">
                <p className="max-w-md text-center text-sm text-muted-foreground">
                  Das Abo ist inaktiv. Ein Administrator kann die Zahlung
                  aktualisieren.
                </p>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </SidebarInset>
      <MentionNotice />
    </>
  );
}

export default Layout;
