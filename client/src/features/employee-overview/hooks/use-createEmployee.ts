import { signup } from '@/features/auth/api/auth.api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SubmitHandler, useForm } from 'react-hook-form';
import { CreateWorkerSchema, TWorkerSchema } from '../schemas/schema';

function useCreateEmployee(toggleModal: () => void) {
  const queryClient = useQueryClient();

  const createEmployee = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      toggleModal();
      queryClient.invalidateQueries({
        queryKey: ['EmployeeDataSpecifics'],
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TWorkerSchema>({
    resolver: zodResolver(CreateWorkerSchema),
    criteriaMode: 'all',
  });

  const onFormSubmit: SubmitHandler<TWorkerSchema> = (data: TWorkerSchema) => {
    createEmployee.mutate(data);
    console.log('formdata test', data);
  };

  return {
    register,
    handleSubmit,
    onFormSubmit,
    errors,
  };
}

export default useCreateEmployee;
