import { useSidebar } from '@/components/ui/sidebar';
import { AddWorker } from '@/features/worker-lifecycle/schemas/zod.schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { addWorker, deleteTaskApi, fetchNameData } from '../api';
import { FormType, WorkerItem } from '../types/index.types';

function useHome() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { toggleSidebar } = useSidebar();
  const [modal, setModal] = useState<boolean>(false);
  const navigate = useNavigate({ from: '/' });

  const toggleModal = () => {
    setModal((prev) => !prev);
    toggleSidebar();
  };

  const { data, error, isSuccess } = useQuery<WorkerItem[]>({
    queryKey: ['offboarding'],
    queryFn: fetchNameData,
  });

  const isEmpty = isSuccess && data?.length === 0;

  const filtered = data?.filter((item) =>
    item.vorname.toLowerCase().includes(search.toLowerCase())
  );

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTaskApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offboarding'] });
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: AddWorker) => {
      const response = await addWorker(data);
      return response;
    },
    onSuccess: async (response) => {
      if (response.success) {
        await queryClient.invalidateQueries({
          queryKey: ['offboarding'],
          refetchType: 'all',
        });
        toggleModal();
      }
    },
    onError: (error) => {
      throw new Error(
        'Fehler beim Hinzufügen des Mitarbeiters: ' + error.message
      );
    },
  });

  const handleNavigate = (taskId: number, form_type: FormType) => {
    navigate({
      to: '/user/$Id',
      params: { Id: String(taskId) },
      search: { param1: form_type },
    });
  };

  return {
    isEmpty,
    filtered,
    deleteTaskMutation,
    createEmployeeMutation,
    handleNavigate,
    modal,
    setSearch,
    search,
    error,
    toggleModal,
  };
}
export default useHome;
