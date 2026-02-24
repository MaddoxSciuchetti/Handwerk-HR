import { SetStateAction } from 'react';
import AdminModal from '../admin_data/AdminModal';

type ModalProps = {
  modal: boolean;
  setModalOpen: (value: SetStateAction<boolean>) => void;
  selectedUser: string | null;
};

function Modal({ modal, setModalOpen, selectedUser }: ModalProps) {
  return (
    <>
      {modal && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 bg-black/50 cursor-pointer"
            aria-label="Close modal"
          />
          <AdminModal
            onClose={() => setModalOpen(false)}
            selectedUser={selectedUser}
          />
        </div>
      )}
    </>
  );
}

export default Modal;
