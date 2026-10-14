import { Button } from '@/components/ui/button';
import { TrashIcon } from 'lucide-react';
import type { MouseEvent } from 'react';
import { toast } from 'sonner';
import { useDeleteDocumentMaster } from '../useDeleteDocumentMaster';

type DocumentMasterDeleteProps = {
  id: string;
  name: string;
};

export function DocumentMasterDelete({ id, name }: DocumentMasterDeleteProps) {
  const remove = useDeleteDocumentMaster();

  const onDelete = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    remove.mutate(id, {
      onError: (error) => {
        const message =
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof error.message === 'string'
            ? error.message
            : 'Dokument konnte nicht gelöscht werden.';
        toast.error(message);
      },
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground hover:text-destructive"
      aria-label={`${name} löschen`}
      disabled={remove.isPending}
      onClick={onDelete}
    >
      <TrashIcon className="size-4" />
    </Button>
  );
}
