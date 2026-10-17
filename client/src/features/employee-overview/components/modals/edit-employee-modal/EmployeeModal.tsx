import useGetEmployees from '@/features/employee-overview/hooks/useGetEmployees';
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
    <>
      <FormModalEdit
        id={id}
        fullname={fullname}
        EmployeeData={EmployeeData}
        toggleEmployeeModal={toggleEmployeeModal}
      />
    </>
  );
}

export default ModalEditMitarbeiter;
