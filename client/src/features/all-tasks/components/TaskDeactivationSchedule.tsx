import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiJson } from '@/config/apiClient';
import { FETCHDESCRIPTION } from '../consts/query.consts';
import {
  TASKHISTORY,
  WORKERBYID,
} from '@/features/worker-task-management/consts/query-key.consts';
import { DeactivationScheduleField } from './DeactivationScheduleField';
import { scheduleDateLabel } from '../utils/deactivationSchedule';

type Schedule = {
  scheduledDeactivateAt: string | null;
  scheduledDeactivateTestAt?: string | null;
  canTestSchedule?: boolean;
};
export function TaskDeactivationSchedule({
  taskId,
  disabled,
  beforeSave,
}: {
  taskId: string;
  disabled: boolean;
  beforeSave?: () => Promise<boolean>;
}) {
  const queryClient = useQueryClient();
  const key = ['deactivation-schedule', taskId];
  const url = `/automation/issues/${taskId}/deactivation-schedule`;
  const query = useQuery({
    queryKey: key,
    queryFn: () => apiJson.get<{ data: Schedule }>(url).then((r) => r.data),
    refetchInterval: (query) =>
      query.state.data?.scheduledDeactivateTestAt ? 5_000 : false,
  });
  const previousTest = useRef<string | null>(null);
  useEffect(() => {
    const testAt = query.data?.scheduledDeactivateTestAt ?? null;
    if (previousTest.current && !testAt) {
      void queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
      void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
      void queryClient.invalidateQueries({ queryKey: [TASKHISTORY, taskId] });
    }
    previousTest.current = testAt;
  }, [query.data, queryClient, taskId]);
  const [choosing, setChoosing] = useState(false);
  const save = useMutation({
    mutationFn: async (date: string | null | { testInOneMinute: true }) => {
      if (beforeSave && !(await beforeSave()))
        throw new Error('Aufgabe konnte nicht gespeichert werden.');
      return apiJson
        .patch<{
          data: Schedule;
        }>(url, typeof date === 'object' && date !== null ? date : { scheduledDeactivateAt: date })
        .then((r) => r.data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
      setChoosing(false);
      void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
      void queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
      void queryClient.invalidateQueries({ queryKey: [TASKHISTORY, taskId] });
      void queryClient.invalidateQueries({
        queryKey: ['template-application-result'],
      });
    },
    onError: (error) =>
      toast.error(error.message || 'Datum konnte nicht gespeichert werden.'),
  });
  const date = query.data?.scheduledDeactivateAt ?? null;
  const testAt = query.data?.scheduledDeactivateTestAt;
  const busy = disabled || query.isPending || query.isError || save.isPending;
  return (
    <div className="space-y-2">
      {date && (
        <p className="text-xs text-muted-foreground">
          Geplant · {scheduleDateLabel(date)}
        </p>
      )}
      {testAt ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Geplant ·{' '}
            {new Intl.DateTimeFormat('de-DE', {
              timeZone: 'Europe/Berlin',
              dateStyle: 'short',
              timeStyle: 'medium',
            }).format(new Date(testAt))}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => save.mutate(null)}
          >
            Test abbrechen
          </Button>
        </div>
      ) : (
        <DeactivationScheduleField
          value={date ?? (choosing ? '' : null)}
          disabled={busy}
          onChange={(next) => {
            if (next === '') setChoosing(true);
            else if (next === null && !date) setChoosing(false);
            else save.mutate(next);
          }}
        />
      )}
      {query.data?.canTestSchedule && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => save.mutate({ testInOneMinute: true })}
        >
          In 1 Min. testen
        </Button>
      )}
      {query.isError && (
        <p role="alert" className="text-xs text-destructive">
          Termin konnte nicht geladen werden.
        </p>
      )}
    </div>
  );
}
