import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/selfmade/button';
import { Input } from '@/components/ui/selfmade/input';
import {
  Table,
  TableDivider,
  TableHeader,
} from '@/components/ui/selfmade/table/Table';
import { useState } from 'react';
import { toast } from 'sonner';
import { OrgStatusRow } from './OrgStatusRow';
import { SettingsStatusesHeader } from './SettingsStatusesHeader';
import { createOrgStatusNameSchema } from './org-status.schemas';
import { StatusEntityType } from './org-status.types';
import { useOrgStatuses } from './useOrgStatuses';

type OrgStatusesSettingsPageProps = {
  entityType: StatusEntityType;
  title: string;
  description: string;
};

export function OrgStatusesSettingsPage({
  entityType,
  title,
  description,
}: OrgStatusesSettingsPageProps) {
  const [newName, setNewName] = useState('');
  const {
    statuses,
    isLoading,
    isError,
    createStatus,
    isCreating,
    updateStatus,
    isUpdating,
    deleteStatus,
    isDeleting,
  } = useOrgStatuses(entityType);

  const busy = isCreating || isUpdating || isDeleting;

  const handleAdd = () => {
    const parsed = createOrgStatusNameSchema.safeParse({ name: newName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Ungültiger Name');
      return;
    }
    createStatus(parsed.data.name, {
      onSuccess: () => setNewName(''),
    });
  };

  if (isLoading) return <LoadingAlert />;
  if (isError) {
    return (
      <div className="p-6">Statusliste konnte nicht geladen werden.</div>
    );
  }

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <SettingsStatusesHeader title={title} description={description} />
        <Table className="w-200">
          <TableHeader className="gap-3 py-2">
            <Button
              className="text-sm"
              disabled={busy}
              onClick={handleAdd}
            >
              {isCreating ? 'Wird hinzugefügt…' : 'Hinzufügen'}
            </Button>
            <Input
              placeholder="Name des neuen Status"
              value={newName}
              disabled={busy}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
          </TableHeader>
          <TableDivider />
          {statuses.map((status) => (
            <OrgStatusRow
              key={status.id}
              status={status}
              totalCount={statuses.length}
              disabled={busy}
              onSaveName={(id, name) => updateStatus({ id, name })}
              onDelete={(id) => deleteStatus(id)}
            />
          ))}
        </Table>
      </div>
    </div>
  );
}
