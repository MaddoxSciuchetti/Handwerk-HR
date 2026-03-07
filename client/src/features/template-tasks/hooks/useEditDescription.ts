import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { templateMutations } from '../query-options/mutations/template.mutations';

function useEditDescription(toggleModal: () => void) {
  const [modalState, setModalState] = useState<{
    selectedItem: {
      form_field_id: number | null | undefined;
      description: string | null | undefined;
      owner: string | null | undefined;
    } | null;
  }>({
    selectedItem: null,
  });
  // how to shorten this code? params ?
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

  const { mutate: editDescriptionMutation } = useMutation(
    templateMutations.update()
  );

  return {
    openDescriptionModal,
    editDescriptionMutation,
    modalState,
    setModalState,
  };
}

export default useEditDescription;
