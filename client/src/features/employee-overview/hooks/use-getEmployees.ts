import { useSidebar } from '@/components/ui/sidebar';
import { specificEmployeeData } from '@/lib/api';
import { TEmployeeResponse } from '@/zod-schemas/schema';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

function useGetEmployees() {
  const [modal, setModal] = useState<boolean>(false);
  const [editEmployeeModal, setEditEmployeeModal] = useState<boolean>(false);
  const [name, setFirstName] = useState<string>('');
  const [lastname, setLastName] = useState<string>('');
  const { toggleSidebar } = useSidebar();
  const fullname = `${name} ${lastname}`;
  const [idvalue, setIdValue] = useState<string>();

  const toggleModal = () => {
    setModal((prev) => !prev);
    toggleSidebar();
  };

  const {
    data: EmployeeData,
    isLoading,
    error,
    isError,
  } = useQuery<TEmployeeResponse>({
    queryKey: ['EmployeeDataSpecifics'],
    queryFn: specificEmployeeData,
  });

  return {
    toggleSidebar,
    setLastName,
    toggleModal,
    EmployeeData,
    isLoading,
    error,
    isError,
    modal,
    editEmployeeModal,
    setEditEmployeeModal,
    setFirstName,
    idvalue,
    setIdValue,
    fullname,
  };
}

export default useGetEmployees;
