import { useMutation } from '@tanstack/react-query';
import { SubmitHandler, useForm } from 'react-hook-form';
import { employeeMutations } from '../query-options/mutations/employee.mutations';
import { employeeFormOptions } from '../react-hook-form/employee.options';
import { CreateWorker } from '../schemas/schema';

function useCreateEmployee(toggleModal: () => void) {
  const { mutate: createEmployee } = useMutation(
    employeeMutations.createEmployee()
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWorker>(employeeFormOptions.createEmployee);

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
