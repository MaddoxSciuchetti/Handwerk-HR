import { useBillingSubscription } from '@/features/settings/payments/hooks/useBillingSubscription';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { isSubscriptionLocked } from '@/features/settings/payments/util/subscriptionAccess.util';
import { MentionNotice } from '@/features/all-tasks/components/MentionNotice';
import { isCockpitOwnedPath } from '@/features/worker-lifecycle/components/cockpit-section.consts';
import { useThemeProvider } from '@/hooks/useThemeProvider';
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import AppSidebar from '../ui/sidebar/AppSidebar';
import { SidebarInset } from '@/components/ui/sidebar';
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

  // Dokumente / Templates / etc. live under Cockpit. Their leftover /settings/*
  // URLs must not flip the shell into the stripped SettingsSidebar.
  const pathOpensSettings =
    (location.pathname.startsWith('/settings') ||
      location.pathname === '/bestand') &&
    !isCockpitOwnedPath(location.pathname);
  const subscriptionForcesSettings =
    subscriptionLocked &&
    isAdmin &&
    location.pathname !== '/settings/payments' &&
    location.pathname !== '/settings/plans';

  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    if (pathOpensSettings || subscriptionForcesSettings) {
      setIsSettingOpen(true);
    } else if (!subscriptionForcesSettings) {
      setIsSettingOpen(false);
    }
  }

  const [prevSubscriptionLocked, setPrevSubscriptionLocked] =
    useState(subscriptionLocked);
  if (subscriptionLocked !== prevSubscriptionLocked) {
    setPrevSubscriptionLocked(subscriptionLocked);
    if (subscriptionForcesSettings) setIsSettingOpen(true);
  }

  useEffect(() => {
    if (!subscriptionLocked || !isAdmin) return;
    const path = location.pathname;
    if (path === '/settings/payments' || path === '/settings/plans') return;
    navigate({ to: '/settings/payments' });
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
      <SidebarInset className="flex h-svh grow flex-col overflow-hidden border-border bg-background">
        <header className="flex shrink-0 items-center gap-2 px-10 pt-6 md:px-12 md:pt-8 xl:px-14 xl:pt-14">
          <PagePath />
        </header>
        <main className="flex min-h-0 grow flex-col gap-4 bg-background px-4 py-6 md:px-6 xl:px-8 lg:items-center">
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
