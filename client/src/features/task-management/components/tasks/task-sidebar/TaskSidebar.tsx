import { Button } from '@/components/ui/selfmade/button';
import { X } from 'lucide-react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { SidebarAside } from './SidebarAside';
import SidebarContent from './SidebarContent';
import SidebarFooter from './SidebarFooter';
import SidebarHeader from './SidebarHeader';
import { SidebarPanel } from './SidebarPanel';

type TemplateSidebarProps = {
  isOpen: boolean;
  children?: ReactNode;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

function TemplateSidebar({
  isOpen,
  children,
  setIsOpen,
}: TemplateSidebarProps) {
  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/25 dark:bg-black/40"
          aria-hidden
          onClick={() => setIsOpen(false)}
        />
      ) : null}
      <SidebarAside isOpen={isOpen}>
        <SidebarPanel>
          <SidebarHeader className="flex items-center justify-end py-3">
            <Button type="button" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </SidebarHeader>
          <SidebarContent>{children}</SidebarContent>
          <SidebarFooter />
        </SidebarPanel>
      </SidebarAside>
    </>
  );
}

export default TemplateSidebar;
