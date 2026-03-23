import { useMutation } from '@tanstack/react-query';
import { employeeMutations } from '../query-options/mutations/employee.mutations';
import { useEmployeeModal } from './useEmployeeModal';

function useDeleteEmployee() {
  const { closeEmployee } = useEmployeeModal();

  const {
    mutate: triggerDelete,
    isError: isErrorMutation,
    isPending,
  } = useMutation(employeeMutations.deleteEmployee());

  const handleDeleteEmployee = (id: string) => {
    triggerDelete(id, {
      onSuccess: () => closeEmployee(),
    });
  };
  return {
    handleDeleteEmployee,
    isErrorMutation,
    isPending,
  };
}
export default useDeleteEmployee;
