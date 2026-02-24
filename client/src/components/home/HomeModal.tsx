import { FormInputs } from '@/zod-schemas/zodSchema';
import { UseMutationResult } from '@tanstack/react-query';
import Modal from '@/components/modal/Modal';
import { TOffboardingItemUser } from '@/types/api';

type HomeModalProps = {
  modal: boolean;
  toggleModal: () => void;
  createEmployeeMutation: UseMutationResult<
    TOffboardingItemUser,
    Error,
    FormInputs,
    unknown
  >;
};

const HomeModal = ({
  toggleModal,
  createEmployeeMutation,
  modal,
}: HomeModalProps) => {
  return (
    <>
      {modal && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={toggleModal}
            className="fixed inset-0 bg-black/50 cursor-pointer"
            aria-label="Close modal"
          />
          <Modal
            className="p-4 rounded-lg"
            createEmployeeMutation={createEmployeeMutation}
          />
        </div>
      )}
    </>
  );
};

export default HomeModal;
