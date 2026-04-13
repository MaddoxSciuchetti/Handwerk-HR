import { Button } from '@/components/ui/selfmade/button';
import { Input } from '@/components/ui/selfmade/input';
import { GrowingItem, Items } from '@/components/ui/selfmade/table/Table';
import { cn } from '@/lib/trycatch';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { updateOrgStatusNameSchema } from './org-status.schemas';
import { OrgStatus } from './org-status.types';

type OrgStatusRowProps = {
  status: OrgStatus;
  disabled: boolean;
  totalCount: number;
  onSaveName: (id: string, name: string) => void;
  onDelete: (id: string) => void;
};

export function OrgStatusRow({
  status,
  disabled,
  totalCount,
  onSaveName,
  onDelete,
}: OrgStatusRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(status.name);

  useEffect(() => {
    if (!editing) setDraft(status.name);
  }, [status.name, editing]);

  const canDelete = !disabled && totalCount > 1 && status.usageCount === 0;

  const commit = () => {
    const parsed = updateOrgStatusNameSchema.safeParse({ name: draft });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Ungültiger Name');
      setDraft(status.name);
      setEditing(false);
      return;
    }
    if (parsed.data.name !== status.name) {
      onSaveName(status.id, parsed.data.name);
    }
    setEditing(false);
  };

  return (
    <Items state="hover" className="group relative px-3 py-1">
      <GrowingItem>
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'h-2.5 w-2.5 shrink-0 rounded-full border border-border-default',
              !status.color && 'bg-text-secondary'
            )}
            style={status.color ? { backgroundColor: status.color } : undefined}
            aria-hidden
          />
          {editing ? (
            <Input
              autoFocus
              className="min-w-0 flex-1"
              value={draft}
              disabled={disabled}
              onBlur={commit}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
                if (e.key === 'Escape') {
                  setDraft(status.name);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <button
              type="button"
              disabled={disabled}
              className="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-left text-body-sm transition-colors hover:bg-accent disabled:opacity-50"
              onClick={() => {
                if (!disabled) setEditing(true);
              }}
            >
              {status.name}
            </button>
          )}
        </div>
      </GrowingItem>
      <div className="flex w-10 shrink-0 justify-end">
        <Button
          type="button"
          hierachy="ghost"
          className={cn(
            'h-8 w-8 rounded-lg p-0 opacity-0 transition-opacity group-hover:opacity-100',
            !canDelete && 'pointer-events-none opacity-0'
          )}
          disabled={!canDelete}
          aria-label="Status löschen"
          onClick={() => onDelete(status.id)}
        >
          <Trash2 className="h-4 w-4 text-feedback-danger" />
        </Button>
      </div>
    </Items>
  );
}
