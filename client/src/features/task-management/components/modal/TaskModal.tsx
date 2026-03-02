import ModalOverlay from '@/components/modal/ModalOverlay';
import ModalContent from '@/features/task-management/components/modal/TaskModalContent';
import { SubmitEvent } from 'react';

type TaskModalProps = {
  modalState: {
    selectedItem: {
      id: number;
      description: string;
      editcomment: string;
      select_option: string;
      form_field_id: number;
    } | null;
  };
  closeModal: () => void;
  handleSubmit: (event: SubmitEvent<HTMLFormElement>) => Promise<void>;
};

const TaskModal = ({
  modalState,
  closeModal,
  handleSubmit,
}: TaskModalProps) => {
  return (
    <>
      {modalState.selectedItem && (
        <ModalOverlay handleToggle={closeModal}>
          <ModalContent
            id={modalState.selectedItem.id}
            description={modalState.selectedItem.description}
            editcomment={modalState.selectedItem.editcomment}
            select_option={modalState.selectedItem.select_option}
            form_field_id={modalState.selectedItem.form_field_id}
            handleSubmit={handleSubmit}
          />
        </ModalOverlay>
      )}
    </>
  );
};

export default TaskModal;
