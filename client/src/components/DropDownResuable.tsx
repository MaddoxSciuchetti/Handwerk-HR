import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import DropdownActionTrigger, {
  DropdownActionItem,
} from '@/components/DropdownActionTrigger';
import { useState } from 'react';

type DropDownResuableProps = {
  disabled?: boolean;
  description: string;
  action: () => void;
  actionLabel?: string;
  triggerIcon?: 'trash' | 'edit';
  secondaryAction?: DropdownActionItem;
};

const DropDownResuable = ({
  description,
  disabled,
  action,
  actionLabel = 'Löschen',
  triggerIcon = 'trash',
  secondaryAction,
}: DropDownResuableProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    action();
    closeModal();
  };

  return (
    <>
      <DropdownActionTrigger
        disabled={disabled}
        description={description}
        triggerIcon={triggerIcon}
        actionLabel={actionLabel}
        onPrimaryAction={() => setIsModalOpen(true)}
        secondaryAction={secondaryAction}
      />

      <DeleteConfirmModal
        isOpen={isModalOpen}
        onCancel={closeModal}
        onConfirm={confirmDelete}
      />
    </>
  );
};

export default DropDownResuable;
