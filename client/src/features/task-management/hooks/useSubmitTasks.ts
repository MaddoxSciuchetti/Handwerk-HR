import { taskMutations } from '@/features/template-tasks/query-options/mutations/task.mutations';
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
    formState: { errors },
  } = useForm<TemplateTaskFormValues>({
    defaultValues: initialValues,
  });

  const onSubmit = handleSubmit((data) => {
    if (templateTaskState === 'create') {
      createTask(
        { templateId, data },
        {
          onSuccess: () => toast.success('Aufgabe gespeichert'),
          onError: () => toast.error('Aufgabe konnte nicht gespeichert werden'),
        }
      );
    } else {
      updateTask(
        { taskId, data },
        {
          onSuccess: () => toast.success('Aufgabe gespeichert'),
          onError: () => toast.error('Aufgabe konnte nicht gespeichert werden'),
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
  };
}
