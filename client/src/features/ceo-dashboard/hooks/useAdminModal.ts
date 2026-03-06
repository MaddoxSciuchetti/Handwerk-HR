import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { SubmitHandler, useForm } from 'react-hook-form';
import { adminMutations } from '../query-options/mutations/admin.mutations';
import { sendReminderSchema } from '../schemas/employeeform.schemas';
import { SendReminder } from '../types/adminModal.types';

function useAdminModal() {
  const {
    mutate: sendReminder,
    isError,
    isSuccess,
  } = useMutation<unknown, Error, SendReminder>(adminMutations.sendReminder());

  const onSubmit: SubmitHandler<SendReminder> = (data) => sendReminder(data);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SendReminder>({
    resolver: zodResolver(sendReminderSchema),
  });

  return { isError, isSuccess, onSubmit, register, handleSubmit, errors };
}
export default useAdminModal;
