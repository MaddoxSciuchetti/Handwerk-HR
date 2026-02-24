import { editTaskData } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

function useEditDescription() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(false);
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
  };

  async function openEditModal(
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

  const { mutate: editDescription } = useMutation({
    mutationFn: editTaskData,
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
    openEditModal,
    editDescription,
    modalState,
    toggleModal,
  };
}

export default useEditDescription;
