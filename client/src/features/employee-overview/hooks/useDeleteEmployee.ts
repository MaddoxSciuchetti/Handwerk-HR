import { useMutation } from '@tanstack/react-query';
import { employeeMutations } from '../query-options/mutations/employee.mutations';
import { useEmployeeModal } from './useEmployeeModal';

function useDeleteEmployee() {
  const { closeModal } = useEmployeeModal();

  const {
    mutate: triggerDelete,
    isError: isErrorMutation,
    isPending,
  } = useMutation(employeeMutations.deleteEmployee());

  const DeleteEmployee = (id: string) => {
    triggerDelete(id, {
      onSuccess: () => closeModal(),
    });
  };
  return {
    DeleteEmployee,
    isErrorMutation,
    isPending,
  };
}
export default useDeleteEmployee;
