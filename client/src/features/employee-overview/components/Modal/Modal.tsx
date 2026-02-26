import ModalOverlay from '@/components/modal/ModalOverlay';
import ModalEditMitarbeiter from './ModalEditMitarbeiter';
import ModalMitarbeiter from './ModalMitarbeiter';

type ModalProps = {
  editEmployeeModal: boolean;
  toggleEmployeeModal: () => void;
  fullname: string;
  idvalue: string | undefined;
  modal: boolean;
  toggleModal: () => void;
};

const ModalCompound = ({
  editEmployeeModal,
  toggleEmployeeModal,
  fullname,
  idvalue,
  modal,
  toggleModal,
}: ModalProps) => {
  return (
    <>
      {editEmployeeModal && (
        <ModalOverlay handleToggle={toggleEmployeeModal}>
          <ModalEditMitarbeiter
            fullname={fullname}
            toggleEmployeeModal={toggleEmployeeModal}
            id={idvalue}
          />
        </ModalOverlay>
      )}
      {modal && (
        <ModalOverlay handleToggle={toggleModal}>
          <ModalMitarbeiter toggleModal={toggleModal} />
        </ModalOverlay>
      )}
    </>
  );
};

export default ModalCompound;
