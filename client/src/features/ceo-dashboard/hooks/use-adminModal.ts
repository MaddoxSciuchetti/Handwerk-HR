import { sendReminderWorker } from '@/apis/index.apis';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { SubmitHandler, useForm } from 'react-hook-form';
import { formSchema, sendEmailSchema } from '../types/adminModal.types';

function useAdminModal() {
  const {
    mutate: sendReminder,
    isError,
    isSuccess,
  } = useMutation<unknown, Error, sendEmailSchema>({
    mutationKey: ['employee_email'],
    mutationFn: (data: sendEmailSchema) => sendReminderWorker(data),
  });

  const onSubmit: SubmitHandler<sendEmailSchema> = (data) => sendReminder(data);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<sendEmailSchema>({ resolver: zodResolver(formSchema) });

  return { isError, isSuccess, onSubmit, register, handleSubmit, errors };
}
export default useAdminModal;
