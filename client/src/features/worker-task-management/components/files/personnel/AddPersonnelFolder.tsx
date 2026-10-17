import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreatePersonnelFolder } from '@/features/worker-task-management/hooks/usePersonnelDocuments';
import { FolderPlus } from 'lucide-react';
import { useState } from 'react';
import { StoredFileBox } from '../StoredFileBox';

type AddPersonnelFolderProps = {
  workerId: string;
  engagementId: string;
};

export function AddPersonnelFolder({
  workerId,
  engagementId,
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
      <StoredFileBox
        label="Ordner hinzufügen"
        icon={FolderPlus}
        onOpen={() => setOpen(true)}
      />
      {open ? (
            <Dialog open onOpenChange={(next) => { if (!next) close(); }}>
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
          )
        : null}
    </>
  );
}
