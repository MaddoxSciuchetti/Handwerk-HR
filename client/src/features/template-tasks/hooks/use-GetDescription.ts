import { useSidebar } from '@/components/ui/sidebar';
import { NewDescriptionField } from '@/types/api.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import useEmployeeData from '../../employee-overview/hooks/use-employeeData';
import { createTemplateTask } from '../api';
import useDeleteDescription from './use-DeleteDescription';
import useEditDescription from './use-EditDescription';
import useFetchTask from './use-fetchTask';

function useDescription() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'EDIT' | 'ADD'>();
  const [tab, setTab] = useState<'ONBOARDING' | 'OFFBOARDING'>('ONBOARDING');
  const { EmployeeData } = useEmployeeData();
  const { OnboardingData, OffboardingData } = useFetchTask();
  const { toggleSidebar } = useSidebar();
  const { deleteDescription } = useDeleteDescription();
  const {
    modal,
    setModal,
    openDescriptionModal,
    editDescriptionMutation,
    modalState,
    toggleModal,
  } = useEditDescription();

  const { mutate: handleAddSubmitMutation } = useMutation<
    NewDescriptionField,
    Error,
    {
      description: string;
      template_type: 'ONBOARDING' | 'OFFBOARDING';
      owner: string;
    }
  >({
    mutationFn: createTemplateTask,
    onSuccess: () => {
      toast.success('the field has been added');
      queryClient.invalidateQueries({ queryKey: ['description_root'] });
      toggleModal();
    },
    onError: () => {
      toast.error('the field could not be added');
    },
  });

  const handleOpenModal = () => {
    setModal((prev) => !prev);
    toggleSidebar();
  };

  return {
    editDescriptionMutation,
    handleAddSubmitMutation,
    mode,
    setMode,
    modal,
    modalState,
    openDescriptionModal,
    deleteDescription,
    tab,
    setTab,
    OnboardingData,
    OffboardingData,
    handleOpenModal,
    EmployeeData,
  };
}

export default useDescription;
