import { taskMutations } from '@/features/template-tasks/query-options/mutations/task.mutations';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { TaskSubmission } from '../types/index.types';

export function useSubmitTasks(templateId: string) {
  const { mutate: createTask } = useMutation(taskMutations.createTask());

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskSubmission>({
    defaultValues: {
      taskName: '',
      taskDescription: '',
      defaultPriority: '',
      defaultStatus: '',
    },
  });

  const onSubmit = handleSubmit((data) => {
    createTask(
      { templateId, data },
      {
        onSuccess: () => toast.success('Aufgabe gespeichert'),
        onError: () => toast.error('Aufgabe konnte nicht gespeichert werden'),
      }
    );
  });

  return {
    register,
    handleSubmit,
    errors,
    onSubmit,
  };
}
