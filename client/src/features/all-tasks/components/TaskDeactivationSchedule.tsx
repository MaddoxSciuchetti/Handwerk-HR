import { useState } from 'react';
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

type Schedule = { scheduledDeactivateAt: string | null };
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
  });
  const [choosing, setChoosing] = useState(false);
  const save = useMutation({
    mutationFn: async (date: string | null) => {
      if (beforeSave && !(await beforeSave()))
        throw new Error('Aufgabe konnte nicht gespeichert werden.');
      return apiJson
        .patch<{ data: Schedule }>(url, { scheduledDeactivateAt: date })
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
  return (
    <div className="space-y-2">
      {date && (
        <p className="text-xs text-muted-foreground">
          Geplant · {scheduleDateLabel(date)}
        </p>
      )}
      <DeactivationScheduleField
        value={date ?? (choosing ? '' : null)}
        disabled={
          disabled || query.isPending || query.isError || save.isPending
        }
        onChange={(next) => {
          if (next === '') setChoosing(true);
          else if (next === null && !date) setChoosing(false);
          else save.mutate(next);
        }}
      />
      {query.isError && (
        <p role="alert" className="text-xs text-destructive">
          Termin konnte nicht geladen werden.
        </p>
      )}
    </div>
  );
}
