import { Input } from '@/components/ui/input';
import API from '@/config/apiClient';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import { addWorkerBaseSchema } from '@/features/worker-lifecycle/schemas/zod.schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

type WorkerEmailFieldProps = {
  workerId: string;
  email: string;
};

function WorkerEmailField({ workerId, email }: WorkerEmailFieldProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(email);
  const [errorMessage, setErrorMessage] = useState('');
  const skipSave = useRef(false);

  useEffect(() => {
    setDraft(email);
  }, [email]);

  const { mutate, isPending } = useMutation({
    mutationFn: (nextEmail: string) =>
      API.put(`/worker/${workerId}`, { email: nextEmail }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      setErrorMessage('');
    },
    onError: () => {
      setErrorMessage('E-Mail konnte nicht gespeichert werden.');
    },
  });

  const save = () => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    const parsed = addWorkerBaseSchema.shape.email.safeParse(draft);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'Ungültige email');
      return;
    }
    setErrorMessage('');
    if (parsed.data === email.trim().toLowerCase()) return;
    mutate(parsed.data);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-4 border-b border-border/50 py-2.5">
      <span className="text-sm text-muted-foreground">E-Mail</span>
      <div className="min-w-0">
        <Input
          type="email"
          aria-label="E-Mail"
          autoComplete="email"
          disabled={isPending}
          value={draft}
          placeholder="E-Mail"
          className="h-8 bg-muted text-right text-sm dark:bg-muted"
          onChange={(event) => {
            setDraft(event.target.value);
            setErrorMessage('');
          }}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
            if (event.key === 'Escape') {
              skipSave.current = true;
              setDraft(email);
              setErrorMessage('');
              event.currentTarget.blur();
            }
          }}
        />
        {errorMessage ? (
          <span className="mt-1 block text-right text-sm text-destructive">
            {errorMessage}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default WorkerEmailField;
