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
      <div className="flex flex-col max-h-150 min-h-150 border mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl  w-xl">
        <div className="max-w-xl max-h-140 w-xl flex flex-col">
          <div className="flex w-85 mx-auto flex-col ">
            <FormModalEdit
              id={id}
              fullname={fullname}
              EmployeeData={EmployeeData}
              toggleEmployeeModal={toggleEmployeeModal}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default ModalEditMitarbeiter;
