import { AddWorker } from '@/features/worker-lifecycle/schemas/zod.schemas';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
        <Dialog open onOpenChange={(next) => { if (!next) toggleModal(); }}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <ModalContent
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            toggleModal={toggleModal}
            showInlineFormBackButton
            onQuestionnaire={onQuestionnaire}
          />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default LifeCycleModal;
