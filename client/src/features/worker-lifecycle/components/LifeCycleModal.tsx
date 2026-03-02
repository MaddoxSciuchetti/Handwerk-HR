import ModalOverlay from '@/components/modal/ModalOverlay';
import { AddWorker } from '@/features/worker-lifecycle/schemas/zod.schemas';
import { UseMutationResult } from '@tanstack/react-query';
import { ItemUser } from '../types/index.types';
import ModalContent from './lifycycle-modal-content/ModalContent';

type LifeCycleModalProps = {
  modal: boolean;
  toggleModal: () => void;
  createEmployeeMutation: UseMutationResult<
    ItemUser,
    Error,
    AddWorker,
    unknown
  >;
};

const LifeCycleModal = ({
  toggleModal,
  createEmployeeMutation,
  modal,
}: LifeCycleModalProps) => {
  return (
    <>
      {modal && (
        <ModalOverlay handleToggle={toggleModal}>
          <ModalContent
            className="p-4 rounded-lg"
            createEmployeeMutation={createEmployeeMutation}
          />
        </ModalOverlay>
      )}
    </>
  );
};

export default LifeCycleModal;
