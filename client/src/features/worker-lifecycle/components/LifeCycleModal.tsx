import { AddWorker } from '@/features/worker-lifecycle/schemas/zod.schemas';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { useEffect, useState } from 'react';
import ModalContent from './lifycycle-modal-content/ModalContent';

type LifeCycleModalProps = {
  modal: boolean;
  toggleModal: () => void;
  onQuestionnaire?: (draft: { engagementId: string }) => void;
};

const LifeCycleModal = ({ toggleModal, modal, onQuestionnaire }: LifeCycleModalProps) => {
  const [selectedOption, setSelectedOption] = useState<
    AddWorker['type'] | null
  >(null);

  useEffect(() => {
    if (!modal) {
      setSelectedOption(null);
    }
  }, [modal]);

  return (
    <>
      {modal && (
        <ModalOverlay size={'max-w-2xl'} handleToggle={toggleModal}>
          <ModalContent
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            toggleModal={toggleModal}
            showInlineFormBackButton
            onQuestionnaire={onQuestionnaire}
          />
        </ModalOverlay>
      )}
    </>
  );
};

export default LifeCycleModal;
