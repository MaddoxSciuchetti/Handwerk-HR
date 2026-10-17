import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';
import SidebarHeader from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarHeader';
import { SidebarPanel } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarPanel';
import { X } from 'lucide-react';
import { BestandAddForm } from './BestandAddForm';

type BestandAddSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BestandAddSidebar({ open, onOpenChange }: BestandAddSidebarProps) {
  return (
    <SidebarAside className="p-2" isOpen={open} data-testid="bestand-add-sidebar">
      <SidebarPanel className="w-full">
        <SidebarHeader className="flex items-center justify-between p-6">
          <Label className="text-base font-semibold">Bestand</Label>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-2xl"
            aria-label="Schließen"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </SidebarHeader>
        <BestandAddForm open={open} onAdded={() => onOpenChange(false)} />
      </SidebarPanel>
    </SidebarAside>
  );
}
