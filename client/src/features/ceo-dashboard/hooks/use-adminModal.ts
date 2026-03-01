import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { SubmitHandler, useForm } from 'react-hook-form';
import { sendReminderWorker } from '../api/index.api';
import { SendReminderSchema } from '../schemas/employeeform.schemas';
import { TSendReminderSchema } from '../types/adminModal.types';

function useAdminModal() {
  const {
    mutate: sendReminder,
    isError,
    isSuccess,
  } = useMutation<unknown, Error, TSendReminderSchema>({
    mutationKey: ['employee_email'],
    mutationFn: (data: TSendReminderSchema) => sendReminderWorker(data),
  });

  const onSubmit: SubmitHandler<TSendReminderSchema> = (data) =>
    sendReminder(data);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TSendReminderSchema>({
    resolver: zodResolver(SendReminderSchema),
  });

  return { isError, isSuccess, onSubmit, register, handleSubmit, errors };
}
export default useAdminModal;
