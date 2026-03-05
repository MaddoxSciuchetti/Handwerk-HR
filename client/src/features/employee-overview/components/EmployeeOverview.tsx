import { Table } from '@/components/ui/table';
import useDeleteEmployee from '../hooks/use-deleteEmployee';
import useGetEmployees from '../hooks/use-getEmployees';

import ErrorAlert from '@/components/alerts/ErrorAlert';
import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { useEmployeeModal } from '../hooks/use-employeeModal';
import ModalMitarbeiter from './modals/create-employee-modal/EmployeeModal';
import ModalEditMitarbeiter from './modals/edit-employee-modal/EmployeeModal';
import EmployeeTableHeader from './table/EmployeeTableHeader';
import PageHeader from './table/PageHeader';
import EmployeeTableBody from './table/TableBody';

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

  if (isLoading)
    return (
      <CenteredDiv>
        <LoadingAlert />
      </CenteredDiv>
    );

  if (isPending)
    return (
      <CenteredDiv>
        <LoadingAlert />
      </CenteredDiv>
    );

  if (isError) return <ErrorAlert message={error?.message} />;
  if (!EmployeeData) return <ErrorAlert message="no employees found" />;

  return (
    <div className="rounded-2xl overflow-x-auto w-full h-full p-6 shadow-gray-200 shadow-lg overflow-auto">
      <div className="h-full w-full flex flex-col">
        <PageHeader openCreate={openCreate} />
        <Table className="text-left mt-5 border-seperate border-spacing-y-2">
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
