import { Table } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import useDeleteEmployee from '../hooks/use-deleteEmployee';
import useGetEmployees from '../hooks/use-getEmployees';
import Header from './Table/Header';
import EmployeeTableBody from './Table/TableBody';
import EmployeeTableHeader from './Table/EmployeeTableHeader';
import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import ModalEditMitarbeiter from './modals/EditEmployeeModal/EmployeeModal';
import ModalMitarbeiter from './modals/CreateEmployeeModal/EmployeeModal';

function EmployeeOverview() {
  const {
    toggleModal,
    toggleSidebar,
    EmployeeData,
    isLoading,
    error,
    isError,
    modal,
    editEmployeeModal,
    setEditEmployeeModal,
    setFirstName,
    idvalue,
    setIdValue,
    fullname,
    setLastName,
  } = useGetEmployees();

  const { DeleteEmployee, toggleEmployeeModal, isPending } = useDeleteEmployee(
    toggleSidebar,
    setEditEmployeeModal
  );

  if (isLoading) return <LoadingAlert />;
  if (isPending) return <LoadingAlert />;
  if (isError) return <ErrorAlert message={error?.message} />;
  if (!EmployeeData) return <ErrorAlert message="no employees found" />;

  return (
    <div className="rounded-2xl overflow-x-auto w-full h-full p-6 shadow-gray-200 shadow-lg overflow-auto">
      <div className="h-full w-full flex flex-col">
        {isLoading && <Spinner className="size-8" />}
        <Header toggleModal={toggleModal} />
        <Table className=" text-left mt-5">
          <EmployeeTableHeader />
          <EmployeeTableBody
            EmployeeData={EmployeeData}
            toggleEmployeeModal={toggleEmployeeModal}
            setFirstName={setFirstName}
            setLastName={setLastName}
            setIdValue={setIdValue}
            DeleteEmployee={DeleteEmployee}
          />
        </Table>
      </div>
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
    </div>
  );
}

export default EmployeeOverview;
