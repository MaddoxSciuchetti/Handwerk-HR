import { Input } from '@/components/ui/input';
import { renamePersonnelDocument } from '@/features/worker-task-management/api/personnelDocuments.api';
import { PERSONNEL_DOCUMENTS } from '@/features/worker-task-management/consts/query-key.consts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type PersonnelFileNameProps = {
  workerId: string;
  documentId: string;
  name: string;
};

export function PersonnelFileName({
  workerId,
  documentId,
  name,
}: PersonnelFileNameProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(name);
  useEffect(() => {
    setDraft(name);
  }, [name]);
  const rename = useMutation({
    mutationFn: (next: string) =>
      renamePersonnelDocument(workerId, documentId, next),
    onSuccess: async (result) => {
      setDraft(result.data.name);
      await queryClient.invalidateQueries({
        queryKey: [PERSONNEL_DOCUMENTS, workerId],
      });
    },
    onError: () => {
      setDraft(name);
      toast.error('Der Dateiname konnte nicht gespeichert werden.');
    },
  });
  const save = () => {
    const next = draft.trim();
    if (!next || next === name) {
      setDraft(name);
      return;
    }
    rename.mutate(next);
  };

  return (
    <Input
      aria-label="Dateiname"
      value={draft}
      maxLength={180}
      className="h-7 text-xs"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={save}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
    />
  );
}
