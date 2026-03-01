import { Table } from '@/components/ui/table';
import useDeleteEmployee from '../hooks/use-deleteEmployee';
import useGetEmployees from '../hooks/use-getEmployees';

import EmployeeTableHeader from './table_tmp/EmployeeTableHeader';
import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import ModalEditMitarbeiter from './modals/EditEmployeeModal/EmployeeModal';
import ModalMitarbeiter from './modals/CreateEmployeeModal/EmployeeModal';
import { useEmployeeModal } from '../hooks/use-employeeModal';
import PageHeader from './table_tmp/PageHeader';
import EmployeeTableBody from './table_tmp/TableBody';

function EmployeeOverview() {
  const { EmployeeData, isLoading, error, isError } = useGetEmployees();
  const { modalState, openCreate, closeModal } = useEmployeeModal();
  const { DeleteEmployee, isPending } = useDeleteEmployee();

  const renderModal = () => {
    switch (modalState.kind) {
      case 'edit':
        return (
          <ModalOverlay handleToggle={closeModal}>
            <ModalEditMitarbeiter
              fullname={modalState.fullname}
              id={modalState.employeeId}
              toggleEmployeeModal={closeModal}
            />
          </ModalOverlay>
        );
      case 'create':
        return (
          <ModalOverlay handleToggle={closeModal}>
            <ModalMitarbeiter toggleModal={closeModal} />
          </ModalOverlay>
        );
    }
  };

  if (isLoading) return <LoadingAlert />;
  if (isPending) return <LoadingAlert />;
  if (isError) return <ErrorAlert message={error?.message} />;
  if (!EmployeeData) return <ErrorAlert message="no employees found" />;

  return (
    <div className="rounded-2xl overflow-x-auto w-full h-full p-6 shadow-gray-200 shadow-lg overflow-auto">
      <div className="h-full w-full flex flex-col">
        <PageHeader openCreate={openCreate} />
        <Table className=" text-left mt-5">
          <EmployeeTableHeader />
          <EmployeeTableBody
            EmployeeData={EmployeeData}
            DeleteEmployee={DeleteEmployee}
          />
        </Table>
      </div>
      {renderModal()}
    </div>
  );
}

export default EmployeeOverview;
