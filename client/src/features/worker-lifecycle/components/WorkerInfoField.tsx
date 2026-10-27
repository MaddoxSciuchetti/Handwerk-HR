import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import API from '@/config/apiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { WORKERBYID } from '@/features/worker-task-management/consts/query-key.consts';
import { ALL_WORKER_DATA } from '../consts/query-key.consts';
import type { WorkerEngagementInfoItem } from '../consts/worker-engagement-info.consts';

const fieldClass =
  'h-8 w-full min-w-0 rounded-md border-transparent bg-muted/50 px-3 text-right text-sm shadow-none focus:border-border focus:bg-muted focus-visible:border-border focus-visible:ring-0 dark:bg-muted/50 dark:focus:bg-muted';

type Props = {
  workerId: string;
  item: WorkerEngagementInfoItem;
};

export default function WorkerInfoField({ workerId, item }: Props) {
  const queryClient = useQueryClient();
  const [edit, setEdit] = useState<{ source: string; value: string } | null>(
    null
  );
  const draft = edit?.source === item.value ? edit.value : item.value;
  const setDraft = (value: string) => setEdit({ source: item.value, value });
  const [error, setError] = useState('');
  const skipSave = useRef(false);

  const mutation = useMutation({
    mutationFn: (value: string | null) => {
      if (item.editable === 'phase') {
        return API.put(`/worker/${workerId}/engagements/${item.engagementId}`, {
          type: value,
        });
      }
      const payload =
        item.editable === 'workwearSize'
          ? { workwearSize: { itemName: item.itemName, size: value ?? '' } }
          : { [item.editable!]: value };
      return API.put(`/worker/${workerId}`, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      void queryClient.invalidateQueries({ queryKey: [WORKERBYID, workerId] });
      setError('');
    },
    onError: () => setError(`${item.label} konnte nicht gespeichert werden.`),
  });

  function save() {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    const value = draft.trim();
    if (item.required && !value) {
      setError('Erforderlich');
      return;
    }
    if (item.maxLength && value.length > item.maxLength) {
      setError(`Maximal ${item.maxLength} Zeichen`);
      return;
    }
    if (value === item.value.trim()) return;
    let nextValue: string | null = value || null;
    if (item.inputType === 'date' && value) {
      const date = new Date(`${value}T00:00:00.000Z`);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
      ) {
        setError('Ungültiges Datum');
        return;
      }
      nextValue = date.toISOString();
    }
    setError('');
    mutation.mutate(nextValue);
  }

  const shared = {
    'aria-label': item.label,
    disabled: mutation.isPending,
    value: draft,
    className: cn(
      fieldClass,
      item.inputType === 'date' &&
        '[&::-webkit-datetime-edit]:flex [&::-webkit-datetime-edit]:flex-1 [&::-webkit-datetime-edit]:justify-end [&::-webkit-datetime-edit-fields-wrapper]:flex [&::-webkit-datetime-edit-fields-wrapper]:justify-end [&::-webkit-calendar-picker-indicator]:ml-2 [&::-webkit-date-and-time-value]:text-right'
    ),
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setDraft(event.target.value);
      setError('');
    },
    onBlur: save,
    onKeyDown: (event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.currentTarget.blur();
      }
      if (event.key === 'Escape') {
        skipSave.current = true;
        setDraft(item.value);
        setError('');
        event.currentTarget.blur();
      }
    },
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-4 border-b border-border/50 py-2.5">
      <span className="text-sm text-muted-foreground">{item.label}</span>
      <div className="min-w-0">
        {item.editable === 'phase' ? (
          <select {...shared}>
            <option value="onboarding">Onboarding</option>
            <option value="offboarding">Offboarding</option>
            <option value="transfer">Team</option>
          </select>
        ) : (
          <Input
            {...shared}
            type={item.inputType ?? 'text'}
            maxLength={item.maxLength}
            required={item.required}
          />
        )}
        {error ? (
          <span
            role="alert"
            className="mt-1 block text-right text-sm text-destructive"
          >
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}
