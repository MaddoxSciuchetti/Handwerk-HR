// src/routes/__root.tsx
import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/auth/app-sidebar';
import { useState } from 'react';
import FeatureModal from '@/components/modal/FeatureModal';
import ModalOverlay from '@/components/modal/ModalOverlay';

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
        <Outlet />
      </main>
    );
  }

  return (
    <SidebarProvider>
      <SidebarLayout />
    </SidebarProvider>
  );
}

function SidebarLayout() {
  const [modal, setModal] = useState<boolean>(false);
  const { toggleSidebar } = useSidebar();

  const handleOpenModal = () => {
    setModal((prev) => !prev);
    toggleSidebar();
  };

  return (
    <>
      <AppSidebar openModal={handleOpenModal} />
      <SidebarInset className="flex flex-col h-svh md:w-max-svw">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex flex-col lg:items-center grow lg:min-w-96 gap-4 p-4">
          <div className="grow w-full min-w-0  h-full overflow-hidden">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
      {modal && (
        <ModalOverlay handleToggle={handleOpenModal}>
          <FeatureModal />
        </ModalOverlay>
      )}
    </>
  );
}
