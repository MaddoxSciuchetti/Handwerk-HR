import { FormInputs } from '@/schemas/zodSchema';
import { UseMutationResult } from '@tanstack/react-query';
import Modal from '@/components/modal/Modal';

type HomeModalProps = {
  modal: boolean;
  toggleModal: () => void;
  onSubmit: UseMutationResult<any, Error, FormInputs, unknown>;
};

const HomeModal = ({ toggleModal, onSubmit, modal }: HomeModalProps) => {
  return (
    <>
      {modal && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={toggleModal}
            className="fixed inset-0 bg-black/50 cursor-pointer"
            aria-label="Close modal"
          />
          <Modal className="p-4 rounded-lg" onSuccess={onSubmit} />
        </div>
      )}
    </>
  );
};

export default HomeModal;
