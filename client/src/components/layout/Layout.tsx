import { useBillingSubscription } from '@/features/settings/payments/hooks/useBillingSubscription';
import { isSubscriptionLocked } from '@/features/settings/payments/util/subscriptionAccess.util';
import { MentionNotice } from '@/features/all-tasks/components/MentionNotice';
import FeatureModal from '@/features/sidebar/feature-modal/FeatureModal';
import { useThemeProvider } from '@/hooks/useThemeProvider';
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AppSidebar from '../ui/sidebar/AppSidebar';
import {
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import PagePath from './headers/PagePath';
import { SettingsSidebar } from './SettingsSidebar';

function Layout() {
  const [modal, setModal] = useState<boolean>(false);
  const { theme } = useThemeProvider();
  const [isSettingOpen, setIsSettingOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: subscription, isFetched, isError } = useBillingSubscription();

  const subscriptionLocked = useMemo(
    () =>
      isFetched && !isError && isSubscriptionLocked(subscription ?? undefined),
    [isFetched, isError, subscription]
  );

  useEffect(() => {
    if (location.pathname.startsWith('/settings')) {
      setIsSettingOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!subscriptionLocked) return;
    const path = location.pathname;
    if (path === '/settings/payments' || path === '/settings/plans') return;
    navigate({ to: '/settings/payments' });
    setIsSettingOpen(true);
  }, [subscriptionLocked, location.pathname, navigate]);

  const handleOpenModal = () => {
    setModal((prev) => !prev);
  };

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
          openModal={handleOpenModal}
          setIsSettingOpen={setIsSettingOpen}
        />
      )}
      <SidebarInset className="mt-1 mb-1 ml-1 flex h-[calc(100svh-0.5rem)] grow flex-col overflow-hidden rounded-2xl border border-border bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <PagePath />
        </header>
        <main className="flex min-h-0 grow flex-col gap-4 bg-background p-4 lg:items-center">
          <div className="h-full w-full min-h-0 min-w-0 grow overflow-hidden">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
      <MentionNotice />
      {modal && (
        <Dialog open onOpenChange={(next) => { if (!next) handleOpenModal(); }}>
          <DialogContent
            overlayClassName="bg-black/30"
            className="border-0 bg-transparent p-0 shadow-none"
          >
            <FeatureModal handleToggle={handleOpenModal} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default Layout;
