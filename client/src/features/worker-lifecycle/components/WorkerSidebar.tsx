import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/selfmade/button';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';
import SidebarContent from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarContent';
import SidebarHeader from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarHeader';
import { SidebarPanel } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarPanel';
import { AddWorker } from '@/features/worker-lifecycle/schemas/zod.schemas';
import { ArrowLeft, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import ModalContent from './lifycycle-modal-content/ModalContent';

type WorkerSidebarProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export function WorkerSidebar({ isOpen, setIsOpen }: WorkerSidebarProps) {
  const [selectedOption, setSelectedOption] = useState<AddWorker['type'] | null>(
    null
  );

  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedOption(null);
    }
  }, [isOpen]);

  const isFormStep = selectedOption !== null;

  return (
    <SidebarAside className="p-2" isOpen={isOpen}>
      <SidebarPanel className="w-full">
        <SidebarHeader className="flex items-center justify-between p-6">
          {isFormStep ? (
            <Button
              type="button"
              className="shrink-0 border-0 bg-interactive-primary-bg text-sm text-interactive-primary-text hover:bg-interactive-primary-hover"
              onClick={() => setSelectedOption(null)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          ) : (
            <Label className="typo-body-lg font-bold">Mitarbeiter</Label>
          )}
          <Button
            type="button"
            size="icon"
            aria-label="Schließen"
            className="bg-transparent text-foreground shadow-none hover:bg-muted"
            onClick={close}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </SidebarHeader>
        <SidebarContent className="mt-2 flex min-h-0 grow flex-col overflow-hidden p-6">
          <ModalContent
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            toggleModal={close}
            showInlineFormBackButton={false}
          />
        </SidebarContent>
      </SidebarPanel>
    </SidebarAside>
  );
}
