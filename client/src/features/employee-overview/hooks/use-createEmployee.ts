import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { SubmitHandler, useForm } from 'react-hook-form';
import { employeeMutations } from '../query-options/mutations/employee.mutations';
import { CreateWorker, createWorkerSchema } from '../schemas/schema';

function useCreateEmployee(toggleModal: () => void) {
  const { mutate: createEmployee } = useMutation(
    employeeMutations.createEmployee()
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWorker>({
    resolver: zodResolver(createWorkerSchema),
    criteriaMode: 'all',
  });

  const onFormSubmit: SubmitHandler<CreateWorker> = (data: CreateWorker) => {
    createEmployee(data, {
      onSuccess: () => {
        toggleModal();
      },
    });
  };

  return {
    register,
    handleSubmit,
    onFormSubmit,
    errors,
  };
}

export default useCreateEmployee;
