import FeatureModal from '@/features/sidebar/feature-modal/FeatureModal';
import { useThemeProvider } from '@/hooks/useThemeProvider';
import { Outlet } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import ModalOverlay from '../modal/ModalOverlay';
import AppSidebar from '../ui/sidebar/AppSidebar';
import {
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '../ui/sidebar/sidebar';
import PagePath from './headers/PagePath';
import { SettingsSidebar } from './SettingsSidebar';

function Layout() {
  const [modal, setModal] = useState<boolean>(false);
  const { toggleSidebar } = useSidebar();
  const { theme } = useThemeProvider();
  const [isSettingOpen, setIsSettingOpen] = useState<boolean>(false);

  const handleOpenModal = () => {
    setModal((prev) => !prev);
    toggleSidebar();
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
          className="rounded-2xl"
          setIsSettingOpen={setIsSettingOpen}
        />
      ) : (
        <AppSidebar
          className="rounded-2xl"
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
          <div className="h-full w-full min-h-0 min-w-0 grow overflow-auto">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
      {modal && (
        <ModalOverlay handleToggle={handleOpenModal}>
          <FeatureModal handleToggle={handleOpenModal} />
        </ModalOverlay>
      )}
    </>
  );
}

export default Layout;
