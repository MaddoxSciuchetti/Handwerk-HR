import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dispatch, SetStateAction } from 'react';
import { deleteEmployeeHandler } from '../api';

function useDeleteEmployee(
  toggleSidebar: () => void,
  setEditEmplyoeeModal: Dispatch<SetStateAction<boolean>>
) {
  const queryClient = useQueryClient();

  const toggleEmployeeModal = () => {
    setEditEmplyoeeModal((prev) => !prev);
    toggleSidebar();
  };

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
    },
    onError: () => {
      console.log(errorMutation);
    },
  });

  return {
    DeleteEmployee,
    isErrorMutation,
    toggleEmployeeModal,
    isPending,
  };
}
export default useDeleteEmployee;
