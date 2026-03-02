import { useThemeProvider } from '@/hooks/use-themeProvider';
import { Outlet } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import ModalOverlay from '../modal/ModalOverlay';
import { SidebarInset, SidebarTrigger, useSidebar } from '../ui/sidebar';
import { AppSidebar } from './sidebar/AppSidebar';
import FeatureModal from './sidebar/FeatureModal';

function Layout() {
  const [modal, setModal] = useState<boolean>(false);
  const { toggleSidebar } = useSidebar();
  const { theme } = useThemeProvider();

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
      <AppSidebar openModal={handleOpenModal} />
      <SidebarInset className="flex flex-col h-svh md:w-max-svw">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main
          className={`bg- flex flex-col lg:items-center grow lg:min-w-96 gap-4 p-4`}
        >
          <div className={`grow w-full min-w-0  h-full overflow-hidden`}>
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

export default Layout;
