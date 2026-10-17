import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { useDeleteTasks } from '../hooks/useDeleteTasks';

type EngagementTaskDeleteButtonProps = {
  taskId: string;
  disabled?: boolean;
  onDeleted?: () => void;
  className?: string;
};

export function EngagementTaskDeleteButton({
  taskId,
  disabled = false,
  onDeleted,
  className,
}: EngagementTaskDeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate, isPending } = useDeleteTasks();

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          'text-muted-foreground hover:text-destructive',
          className
        )}
        aria-label="Aufgabe löschen"
        disabled={disabled || isPending || taskId.length === 0}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen(true);
        }}
      >
        <TrashIcon className="size-4" aria-hidden />
      </Button>
      <DeleteConfirmModal
        isOpen={isOpen}
        onCancel={() => setIsOpen(false)}
        onConfirm={() => {
          setIsOpen(false);
          mutate([taskId], {
            onSuccess: () => onDeleted?.(),
          });
        }}
      />
    </>
  );
}
