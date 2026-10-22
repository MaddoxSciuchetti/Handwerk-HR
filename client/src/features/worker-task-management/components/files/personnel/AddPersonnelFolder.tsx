import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreatePersonnelFolder } from '@/features/worker-task-management/hooks/usePersonnelDocuments';
import { Plus } from 'lucide-react';
import { useState } from 'react';

type AddPersonnelFolderProps = {
  workerId: string;
  engagementId: string;
  onAddFile: () => void;
};

export function AddPersonnelFolder({
  workerId,
  engagementId,
  onAddFile,
}: AddPersonnelFolderProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const create = useCreatePersonnelFolder(workerId);
  const close = () => {
    setOpen(false);
    setLabel('');
  };
  const submit = () => {
    const next = label.trim();
    if (!next) return;
    create.mutate(
      { engagementId, label: next },
      { onSuccess: close }
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto"
            aria-label="Hinzufügen"
          >
            <Plus aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onAddFile}>Datei</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setOpen(true)}>
            Ordner
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {open ? (
        <Dialog
          open
          onOpenChange={(next) => {
            if (!next) close();
          }}
        >
          <DialogContent className="h-auto">
            <CardContent className="flex w-full min-w-0 flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="personnel-folder-name">Ordnername</Label>
                <Input
                  id="personnel-folder-name"
                  aria-label="Ordnername"
                  value={label}
                  maxLength={80}
                  onChange={(event) => setLabel(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') submit();
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={!label.trim() || create.isPending}
                onClick={submit}
              >
                {create.isPending ? 'Legt an...' : 'Hinzufügen'}
              </Button>
            </CardContent>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
