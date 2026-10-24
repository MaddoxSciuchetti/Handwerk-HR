import { taskMutations } from '@/features/template-tasks/query-options/mutations/task.mutations';
import { templateTaskFormSchema } from '@/features/template-tasks/schemas/templateTaskForm.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { TemplateTaskFormValues } from '../types/index.types';

export function useSubmitTasks(
  taskId: string,
  templateId: string,
  templateTaskState: 'create' | 'edit',
  initialValues: TemplateTaskFormValues
) {
  const { mutate: createTask } = useMutation(taskMutations.createTask());
  const { mutate: updateTask } = useMutation(taskMutations.updateTask());

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    formState: { errors },
  } = useForm<TemplateTaskFormValues>({
    resolver: zodResolver(templateTaskFormSchema),
    defaultValues: initialValues,
  });

  const onSaveError = (error: unknown) => {
    const message =
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.trim()
        ? error.message
        : 'Aufgabe konnte nicht gespeichert werden';

    if (
      message === 'Bitte eine Nachrichtenvorlage mit Inhalt wählen.' ||
      message === 'Bitte wähle eine E-Mail-Vorlage.' ||
      message === 'Die E-Mail-Vorlage wurde nicht gefunden.'
    ) {
      setError('mailTemplateId', { type: 'server', message });
    }
    toast.error(message);
  };

  const onSubmit = handleSubmit((data) => {
    if (templateTaskState === 'create') {
      createTask(
        { templateId, data },
        {
          onSuccess: () => toast.success('Aufgabe gespeichert'),
          onError: onSaveError,
        }
      );
    } else {
      updateTask(
        { taskId, data },
        {
          onSuccess: () => toast.success('Aufgabe gespeichert'),
          onError: onSaveError,
        }
      );
    }
  });

  return {
    register,
    handleSubmit,
    errors,
    onSubmit,
    control,
    setValue,
  };
}
