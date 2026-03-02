import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { editEmployeeAbsence } from '../api/employee-overview.api';
import { absenceSchema } from '../schemas/schema';
import { AbsenceData } from '../types/index.types';

function useEditEmployee(toggleEmployeeModal: () => void) {
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState<boolean>();
  const EmployeeAbsence = useMutation({
    mutationFn: editEmployeeAbsence,
    onSuccess: () => {
      setSuccess(true);
      toggleEmployeeModal();
      queryClient.invalidateQueries({
        queryKey: ['EmployeeDataSpecifics'],
      });
      console.log('sucessfully submitted');
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AbsenceData>({
    resolver: zodResolver(absenceSchema),
    criteriaMode: 'all',
  });

  const onSubmit: SubmitHandler<AbsenceData> = (data) => {
    console.log(data);
    EmployeeAbsence.mutate(data);
  };

  return {
    success,
    setSuccess,
    queryClient,
    EmployeeAbsence,
    register,
    handleSubmit,
    control,
    errors,
    onSubmit,
  };
}

export default useEditEmployee;
