import useEmployeeData from '@/features/employee-overview/hooks/use-employeeData';
import { Spinner } from '../../../../../components/ui/spinner';
import ModalFormEdit from './ModalForm.Edit';

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
  const {
    EmployeeData,
    isLoading: isLoadingEmployee,
    isError: isErrorEmployee,
  } = useEmployeeData();

  if (isErrorEmployee) return <div>No error</div>;

  return (
    <>
      <div className="flex flex-col max-h-150 min-h-150 border border-amber-400 mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl  w-xl">
        {isLoadingEmployee ? (
          <Spinner className="size-8" />
        ) : (
          <div className="max-w-xl max-h-140 w-xl flex flex-col">
            <div className="flex w-85 mx-auto flex-col ">
              <ModalFormEdit
                id={id}
                fullname={fullname}
                EmployeeData={EmployeeData}
                toggleEmployeeModal={toggleEmployeeModal}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ModalEditMitarbeiter;
