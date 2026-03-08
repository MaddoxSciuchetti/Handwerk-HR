import ModalOverlay from '@/components/modal/ModalOverlay';
import { AddWorkerMutation } from '../types/mutation.types';
import ModalContent from './lifycycle-modal-content/ModalContent';

type LifeCycleModalProps = {
  modal: boolean;
  toggleModal: () => void;
  addWorkerMutation: AddWorkerMutation;
};

const LifeCycleModal = ({
  toggleModal,
  addWorkerMutation,
  modal,
}: LifeCycleModalProps) => {
  return (
    <>
      {modal && (
        <ModalOverlay handleToggle={toggleModal}>
          <ModalContent
            className="p-4 rounded-lg bg-white"
            addWorkerMutation={addWorkerMutation}
            toggleModal={toggleModal}
          />
        </ModalOverlay>
      )}
    </>
  );
};

export default LifeCycleModal;
