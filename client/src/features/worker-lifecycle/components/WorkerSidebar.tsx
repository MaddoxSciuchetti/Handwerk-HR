import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';
import SidebarContent from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarContent';
import SidebarHeader from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarHeader';
import { SidebarPanel } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarPanel';
import { X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { WorkerForm } from './lifycycle-modal-content/WorkerForm';

type WorkerSidebarProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onQuestionnaire?: (draft: { engagementId: string }) => void;
};

export function WorkerSidebar({
  isOpen,
  setIsOpen,
  onQuestionnaire,
}: WorkerSidebarProps) {
  const close = () => setIsOpen(false);

  return (
    <SidebarAside className="p-2" isOpen={isOpen} onClose={close}>
      <SidebarPanel className="w-full">
        <SidebarHeader className="flex items-center justify-between p-6">
          <Label className="typo-body-lg font-bold">Mitarbeiter</Label>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-2xl"
            aria-label="Schließen"
            onClick={close}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </SidebarHeader>
        <SidebarContent className="mt-2 flex min-h-0 grow flex-col overflow-hidden p-6">
          <WorkerForm
            type="Onboarding"
            setSelectedOption={() => {}}
            toggleModal={close}
            showInlineFormBackButton={false}
            onQuestionnaire={onQuestionnaire}
          />
        </SidebarContent>
      </SidebarPanel>
    </SidebarAside>
  );
}
