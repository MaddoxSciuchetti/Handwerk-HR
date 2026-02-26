import { useSidebar } from '@/components/ui/sidebar';
import { useState } from 'react';
import useEmployeeData from '../../../hooks/use-employeeData';
import { toast } from 'sonner';
import useFetchTask from '../../../hooks/use-fetchTask';
import useDeleteDescription from './use-DeleteDescription';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { newField } from '@/types/api';
import { addExtraField } from '../api';
import useEditDescription from './use-editdescription';

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
    newField,
    Error,
    {
      description: string;
      template_type: 'ONBOARDING' | 'OFFBOARDING';
      owner: string;
    }
  >({
    mutationFn: addExtraField,
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
