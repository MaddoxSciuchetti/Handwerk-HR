import useGetEmployees from '@/features/employee-overview/hooks/useGetEmployees';
import SmallWrapper from '../../../../../components/modal/modalSizes/SmallWrapper';
import FormModalEdit from './FormModal.Edit';

type ModalEditMitarbeiterProps = {
  fullname: string;
  toggleEmployeeModal: () => void;
  id: string | undefined;
};

function ModalEditMitarbeiter({
  fullname,
  toggleEmployeeModal,
  id,
}: ModalEditMitarbeiterProps) {
  const { EmployeeData } = useGetEmployees();

  return (
    <SmallWrapper className="items-stretch justify-start overflow-hidden">
      <FormModalEdit
        id={id}
        fullname={fullname}
        EmployeeData={EmployeeData}
        toggleEmployeeModal={toggleEmployeeModal}
      />
    </SmallWrapper>
  );
}

export default ModalEditMitarbeiter;
