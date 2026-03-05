import { User } from '@/features/user-profile/types/auth.type';
import { useQueryClient } from '@tanstack/react-query';
import { SubmitEvent } from 'react';
import { updateWorkerData, updateWorkerHistory } from '../api/index.api';
import { FORMHISTORY, WORKERBYID } from '../consts/query-key.consts';
import { formSchema } from '../schemas/index.schema';

function useTaskSubmit(
  id: number,
  user: User | undefined,
  closeModal: () => void
) {
  const queryClient = useQueryClient();

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formValues = Object.fromEntries(formData);

    const result = formSchema.safeParse(formValues);

    if (!result.success) {
      console.log('validation errors', result.error);
      return;
    }
    if (!user) {
      console.log('user not authenticated');
      return;
    }

    await updateWorkerHistory(result.data, user);
    await queryClient.invalidateQueries({
      queryKey: [FORMHISTORY, parseInt(result.data.id)],
    });
    await updateWorkerData(result.data);

    await queryClient.invalidateQueries({
      queryKey: [WORKERBYID, id],
    });

    closeModal();
  }

  return {
    handleSubmit,
  };
}

export default useTaskSubmit;
