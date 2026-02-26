import { FormInputs } from '@/zod-schemas/zodSchema';
import { UseMutationResult } from '@tanstack/react-query';
import ModalOverlay from '@/components/modal/ModalOverlay';
import ModalContent from './lifycycle-modal-content/ModalContent';
import { TOffboardingItemUser } from '../types';

type LifeCycleModalProps = {
  modal: boolean;
  toggleModal: () => void;
  createEmployeeMutation: UseMutationResult<
    TOffboardingItemUser,
    Error,
    FormInputs,
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
