import FormSelectOptions from '@/components/form/FormSelectOptions';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  TASKHISTORY,
  WORKERBYID,
} from '@/features/worker-task-management/consts/query-key.consts';
import { tryCatch } from '@/lib/trycatch';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { runTaskAutomation } from '../api/tasks.api';
import { FETCHDESCRIPTION } from '../consts/query.consts';
import {
  ARBEITSZEUGNIS,
  O365_BLOCK_SIGN_IN,
  TASK_AUTOMATION_NONE,
  TASK_AUTOMATION_OPTIONS,
  TEAM_DEPARTURE_MAIL,
} from '../consts/task-automation.consts';
import type { TaskSidebarForm } from '../types/index.types';

type TaskAutomationProps = {
  taskId: string;
  control: Control<TaskSidebarForm>;
  errors: FieldErrors<TaskSidebarForm>;
  setValue: UseFormSetValue<TaskSidebarForm>;
  disabled: boolean;
  onOpenArbeitszeugnis?: () => void;
};

function TaskAutomation({
  taskId,
  control,
  errors,
  setValue,
  disabled,
  onOpenArbeitszeugnis,
}: TaskAutomationProps) {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const automation = useWatch({ control, name: 'automation' });
  const canRun =
    (automation === O365_BLOCK_SIGN_IN ||
      automation === TEAM_DEPARTURE_MAIL ||
      automation === ARBEITSZEUGNIS) &&
    !disabled &&
    !isRunning;

  const onGo = async () => {
    if (!canRun) return;
    if (automation === ARBEITSZEUGNIS) {
      onOpenArbeitszeugnis?.();
      return;
    }
    setIsRunning(true);
    const [, error] = await tryCatch(runTaskAutomation({ taskId, automation }));
    setIsRunning(false);
    if (error) {
      const message =
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : 'Automatisierung konnte nicht ausgeführt werden.';
      toast.error(message);
      return;
    }
    setValue('status', 'done');
    void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
    void queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
    void queryClient.invalidateQueries({ queryKey: [TASKHISTORY, taskId] });
    toast.success(
      automation === TEAM_DEPARTURE_MAIL
        ? 'Das Team wurde über die Entlassung informiert. Die Aufgabe ist erledigt.'
        : 'Anmeldung bei Microsoft 365 ist gesperrt. Die Aufgabe ist erledigt.'
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <FormSelectOptions
        name="automation"
        control={control}
        data={[...TASK_AUTOMATION_OPTIONS]}
        placeholder="Automatisierung"
        errors={errors}
        label="Automatisierung"
        defaultValue={TASK_AUTOMATION_NONE}
      />
      <Button
        type="button"
        className="rounded-2xl"
        disabled={!canRun}
        aria-busy={isRunning}
        onClick={() => void onGo()}
      >
        {isRunning ? (
          <>
            <Spinner className="size-4 text-(--automation-accent)" />
            Wird ausgeführt…
          </>
        ) : (
          'Go'
        )}
      </Button>
    </div>
  );
}

export default TaskAutomation;
