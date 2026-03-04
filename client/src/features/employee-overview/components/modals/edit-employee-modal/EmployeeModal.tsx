import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import useEmployeeData from '@/features/employee-overview/hooks/use-employeeData';
import { Spinner } from '../../../../../components/ui/spinner';
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
  const {
    EmployeeData,
    isLoading: isLoadingEmployee,
    isError: isErrorEmployee,
  } = useEmployeeData();

  if (isLoadingEmployee)
    return (
      <CenteredDiv>
        <Spinner className="w-8" />
      </CenteredDiv>
    );
  if (isErrorEmployee) return <div>No error</div>;

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
