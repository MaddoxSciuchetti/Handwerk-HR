import ModalOverlay from '@/components/modal/ModalOverlay';
import ModalContent from './lifycycle-modal-content/ModalContent';

type LifeCycleModalProps = {
  modal: boolean;
  toggleModal: () => void;
};

const LifeCycleModal = ({ toggleModal, modal }: LifeCycleModalProps) => {
  return (
    <>
      {modal && (
        <ModalOverlay size={'max-w-2xl'} handleToggle={toggleModal}>
          <ModalContent toggleModal={toggleModal} />
        </ModalOverlay>
      )}
    </>
  );
};

export default LifeCycleModal;
