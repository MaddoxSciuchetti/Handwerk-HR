import { zodResolver } from '@hookform/resolvers/zod';
import type { Dispatch, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { TaskEditState } from './useTaskSidebar';
import { taskFormSchema } from '../schemas/taskForm.schema';
import { TaskSidebarForm } from '../types/index.types';
import { useCreateTask } from './useCreateTask';
import { useUpdateTask } from './useUpdateTask';

export function useTasks(
  taskEditState: TaskEditState,
  taskState: 'create' | 'edit',
  setIsOpen: Dispatch<SetStateAction<boolean>>
) {
  const { mutate: createTask } = useCreateTask();
  const { mutate: updateTask } = useUpdateTask();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TaskSidebarForm>({
    defaultValues: {
      title: taskEditState.title,
      workerEngagementId: taskEditState.workerEngagementId,
      assigneeUserId: taskEditState.assigneeUserId,
      statusId: taskEditState.statusId,
    },
    resolver: zodResolver(taskFormSchema),
  });

  const onSubmit = handleSubmit((data) => {
    if (taskState === 'create') {
      createTask(data, {
        onSuccess: () => setIsOpen(false),
      });
    } else {
      updateTask(
        { taskId: taskEditState.taskId, data },
        {
          onSuccess: () => setIsOpen(false),
        }
      );
    }
  });

  return { register, control, errors, onSubmit };
}
