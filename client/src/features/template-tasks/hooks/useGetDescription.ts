import { useSidebar } from '@/components/ui/sidebar';
import { NewDescriptionField } from '@/types/api.types';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { templateMutations } from '../query-options/mutations/template.mutations';
import useEditDescription from './useEditDescription';

function useGetDescription() {
  const [mode, setMode] = useState<'EDIT' | 'ADD'>();
  const [tab, setTab] = useState<'ONBOARDING' | 'OFFBOARDING'>('ONBOARDING');
  const { toggleSidebar } = useSidebar();
  const [modal, setModal] = useState(false);

  const toggleModal = () => {
    setModal((prev) => !prev);
    toggleSidebar();
  };

  const { openDescriptionModal, editDescriptionMutation, modalState } =
    useEditDescription(toggleModal);

  const { mutate: handleAddSubmitMutation } = useMutation<
    NewDescriptionField,
    Error,
    {
      description: string;
      template_type: 'ONBOARDING' | 'OFFBOARDING';
      owner: string;
    }
  >(templateMutations.create());

  return {
    editDescriptionMutation,
    handleAddSubmitMutation,
    mode,
    setMode,
    modal,
    modalState,
    openDescriptionModal,
    tab,
    setTab,
    toggleModal,
  };
}

export default useGetDescription;
