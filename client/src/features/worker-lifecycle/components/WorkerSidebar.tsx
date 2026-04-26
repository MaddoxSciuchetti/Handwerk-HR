import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/selfmade/button';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';
import SidebarContent from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarContent';
import SidebarFooter from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarFooter';
import SidebarHeader from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarHeader';
import { SidebarPanel } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarPanel';
import { X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import ModalContent from './lifycycle-modal-content/ModalContent';

type WorkerSidebarProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export function WorkerSidebar({ isOpen, setIsOpen }: WorkerSidebarProps) {
  return (
    <SidebarAside className="p-2" isOpen={isOpen}>
      <SidebarPanel className="w-full">
        <SidebarHeader className="flex items-center justify-between p-6">
          <Label className="typo-body-lg font-bold">Mitarbeiter</Label>
          <Button
            type="button"
            aria-label="Schließen"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </SidebarHeader>
        <SidebarContent className="mt-5 flex flex-col gap-4 p-6">
          <ModalContent />
          {/* TODO: worker details */}
        </SidebarContent>
        <SidebarFooter className="p-6">{/* TODO: actions */}</SidebarFooter>
      </SidebarPanel>
    </SidebarAside>
  );
}
