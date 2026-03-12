import { useState } from 'react';
import { TaskStatus } from '../utils/selectOptionTernary';

function useEditModal(toggleModal: () => void) {
  const [modalState, setModalState] = useState<{
    selectedItem: {
      id: number;
      description: string;
      editcomment: string;
      select_option: TaskStatus;
      form_field_id: number;
    } | null;
  }>({
    selectedItem: null,
  });

  async function openEditModal(
    id: number,
    description: string,
    editcomment: string,
    select_option: TaskStatus,
    form_field_id: number
  ) {
    toggleModal();
    setModalState({
      selectedItem: {
        id,
        description,
        editcomment,
        select_option,
        form_field_id,
      },
    });
  }

  function closeModal() {
    setModalState({
      selectedItem: null,
    });
    toggleModal();
  }

  return { modalState, openEditModal, closeModal, setModalState };
}

export default useEditModal;
