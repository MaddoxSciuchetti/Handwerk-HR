import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { ClothingStockItem } from '@/features/bestand/bestand.api';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';
import SidebarHeader from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarHeader';
import { SidebarPanel } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarPanel';
import { X } from 'lucide-react';
import type { CreateEngagementClothingInput } from '../../api/engagementClothing.api';
import { ClothingAddForm } from './ClothingAddForm';

type ClothingAddSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: ClothingStockItem[];
  pending: boolean;
  onAdd: (input: CreateEngagementClothingInput) => Promise<unknown>;
};

export function ClothingAddSidebar({
  open,
  onOpenChange,
  stock,
  pending,
  onAdd,
}: ClothingAddSidebarProps) {
  return (
    <SidebarAside
      className="p-2"
      isOpen={open}
      onClose={() => onOpenChange(false)}
      data-testid="clothing-add-sidebar"
    >
      <SidebarPanel className="w-full">
        <SidebarHeader className="flex items-center justify-between p-6">
          <Label className="text-base font-semibold">Kleidung</Label>
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
        <ClothingAddForm
          open={open}
          stock={stock}
          pending={pending}
          onAdd={onAdd}
          onAdded={() => onOpenChange(false)}
        />
      </SidebarPanel>
    </SidebarAside>
  );
}
