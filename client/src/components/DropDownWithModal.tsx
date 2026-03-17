import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import TrashButton from '@/components/TrashButton';
import { useState } from 'react';

type TrashWithModalProps = {
  disabled?: boolean;
  description: string;
  onConfirm: () => void;
  confirmLabel?: string;
};

const TrashWithModal = ({
  disabled,
  description,
  onConfirm,
  confirmLabel = 'Löschen',
}: TrashWithModalProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => setIsModalOpen(false);
  const handleConfirm = () => {
    onConfirm();
    closeModal();
  };

  return (
    <>
      <TrashButton
        disabled={disabled}
        description={description}
        onClick={() => setIsModalOpen(true)}
      />
      <DeleteConfirmModal
        isOpen={isModalOpen}
        onCancel={closeModal}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default TrashWithModal;
