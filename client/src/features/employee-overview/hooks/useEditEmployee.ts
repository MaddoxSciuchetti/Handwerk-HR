import { useMutation } from '@tanstack/react-query';
import { SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { employeeMutations } from '../query-options/mutations/employee.mutations';
import { employeeFormOptions } from '../react-hook-form/employee.options';
import { AbsenceData } from '../types/index.types';

function useEditEmployee(toggleEmployeeModal: () => void) {
  const employeeAbsence = useMutation(employeeMutations.editEmployee());

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AbsenceData>(employeeFormOptions.editEmployeeAbsence);

  const onSubmit: SubmitHandler<AbsenceData> = (data) => {
    employeeAbsence.mutate(data, {
      onSuccess: () => {
        toast.success('Abwesenheit geändert');
        toggleEmployeeModal();
      },
    });
  };

  return {
    employeeAbsence,
    register,
    handleSubmit,
    control,
    errors,
    onSubmit,
  };
}

export default useEditEmployee;
