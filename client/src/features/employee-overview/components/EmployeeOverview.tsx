import { Table } from '@/components/ui/table';
import useDeleteEmployee from '../hooks/useDeleteEmployee';
import useGetEmployees from '../hooks/useGetEmployees';

import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { useEmployeeModal } from '../hooks/useEmployeeModal';
import ModalMitarbeiter from './modals/create-employee-modal/EmployeeModal';
import ModalEditMitarbeiter from './modals/edit-employee-modal/EmployeeModal';
import EmployeeTableHeader from './table/EmployeeTableHeader';
import PageHeader from './table/PageHeader';
import EmployeeTableBody from './table/TableBody';

function EmployeeOverview() {
  const { EmployeeData } = useGetEmployees();
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

  if (isPending)
    return (
      <CenteredDiv>
        <LoadingAlert />
      </CenteredDiv>
    );

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
