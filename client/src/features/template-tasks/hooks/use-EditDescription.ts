import { useSidebar } from '@/components/ui/sidebar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { updateTemplateTask } from '../api';
import { EditDescriptionData } from '../types/taskForm.types';

function useEditDescription() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(false);
  const { toggleSidebar } = useSidebar();
  const [modalState, setModalState] = useState<{
    selectedItem: {
      form_field_id: number | null | undefined;
      description: string | null | undefined;
      owner: string | null | undefined;
    } | null;
  }>({
    selectedItem: null,
  });

  const toggleModal = () => {
    setModal((prev) => !prev);
    toggleSidebar();
  };

  async function openDescriptionModal(
    description?: string | null,
    owner?: string,
    form_field_id?: number
  ) {
    toggleModal();
    setModalState({
      selectedItem: {
        form_field_id,
        description,
        owner,
      },
    });
  }

  const { mutate: editDescriptionMutation } = useMutation<
    EditDescriptionData,
    Error,
    EditDescriptionData
  >({
    mutationFn: updateTemplateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['description_root'] });
      setModalState({ selectedItem: null });
      toggleModal();
    },
    onError: () => {
      toast.error('Fehler beim Bearbeiten');
    },
  });

  return {
    modal,
    setModal,
    openDescriptionModal,
    editDescriptionMutation,
    modalState,
    toggleModal,
  };
}

export default useEditDescription;
