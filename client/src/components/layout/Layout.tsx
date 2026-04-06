import { SettingsSidebar } from '@/features/org-settings/components/SettingsSidebar';
import FeatureModal from '@/features/sidebar/feature-modal/FeatureModal';
import { useLayout } from '@/hooks/useLayout';
import { Outlet } from '@tanstack/react-router';
import '../../../globals.css';
import ModalOverlay from '../modal/ModalOverlay';
import AppSidebar from '../ui/sidebar/AppSidebar';
import { SidebarInset, SidebarTrigger } from '../ui/sidebar/Sidebar';
import PagePath from './headers/PagePath';

function Layout() {
  const { isOrgSettings, handleOpenModal, modal } = useLayout();
  return (
    <>
      {isOrgSettings ? (
        <SettingsSidebar />
      ) : (
        <>
          <AppSidebar openModal={handleOpenModal} />
        </>
      )}
      <SidebarInset className="flex flex-col h-svh md:w-max-svw ml-1 mb-1  rounded-xl mt-1">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <PagePath />
        </header>
        <main className="flex grow flex-col gap-4 bg-background p-4 lg:min-w-96 lg:items-center">
          <div className={`grow w-full min-w-0  h-full overflow-hidden`}>
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
