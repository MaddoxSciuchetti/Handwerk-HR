import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteEmployeeHandler } from '../api/employee-overview.api';
import { useEmployeeModal } from './use-employeeModal';

function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const { closeModal } = useEmployeeModal();

  const {
    mutate: DeleteEmployee,
    error: errorMutation,
    isError: isErrorMutation,
    isPending,
  } = useMutation({
    mutationFn: deleteEmployeeHandler,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['EmployeeDataSpecifics'],
      });
      closeModal();
    },
    onError: () => {
      console.log(errorMutation);
    },
  });

  return {
    DeleteEmployee,
    isErrorMutation,
    isPending,
  };
}
export default useDeleteEmployee;
