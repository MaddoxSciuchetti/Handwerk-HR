import { Table } from '@/components/ui/table';
import useDeleteEmployee from '../hooks/useDeleteEmployee';
import useGetEmployees from '../hooks/useGetEmployees';

import LoadingAlert from '@/components/alerts/LoadingAlert';
import SearchHeaderResuable from '@/components/layout/headers/SearchHeaderResuable';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { useState } from 'react';
import { useEmployeeModal } from '../hooks/useEmployeeModal';
import ModalMitarbeiter from './modals/create-employee-modal/EmployeeModal';
import ModalEditMitarbeiter from './modals/edit-employee-modal/EmployeeModal';
import EmployeeInfoModal from './modals/employee-info-modal/EmployeeInfoModal';
import ViewEmployeeModal from './modals/view-employeedata-modal/ViewEmployeeModal';
import EmployeeTableHeader from './table/EmployeeTableHeader';
import EmployeeTableBody from './table/TableBody';

function EmployeeOverview() {
  const { EmployeeData, isLoading } = useGetEmployees();
  const { modalState, openCreateEmployee, closeEmployee } = useEmployeeModal();
  const { handleDeleteEmployee, isPending } = useDeleteEmployee();
  const [search, setSearch] = useState('');

  const filteredEmployeesByFirstName = (EmployeeData ?? []).filter((employee) =>
    employee.vorname.toLowerCase().includes(search.toLowerCase())
  );

  const renderModal = () => {
    switch (modalState.kind) {
      case 'edit':
        return (
          <ModalOverlay handleToggle={closeEmployee}>
            <ModalEditMitarbeiter
              fullname={modalState.fullname}
              id={modalState.employeeId}
              toggleEmployeeModal={closeEmployee}
            />
          </ModalOverlay>
        );
      case 'create':
        return (
          <ModalOverlay handleToggle={closeEmployee}>
            <ModalMitarbeiter toggleModal={closeEmployee} />
          </ModalOverlay>
        );

      case 'employeecreate':
        return (
          <ModalOverlay handleToggle={closeEmployee}>
            <ViewEmployeeModal selectedOwner={modalState.owner} />
          </ModalOverlay>
        );

      case 'employeeinfo':
        return (
          <ModalOverlay handleToggle={closeEmployee}>
            <EmployeeInfoModal employeeId={modalState.employeeId} />;
          </ModalOverlay>
        );
    }
  };

  if (isLoading || isPending) return <LoadingAlert />;

  return (
    <div className="mx-auto flex h-full w-5xl flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl">
      <div className="h-full w-full flex flex-col">
        <SearchHeaderResuable
          search={search}
          setSearch={setSearch}
          openModal={openCreateEmployee}
          description="Mitarbeiter Hinzufügen"
        />
        <Table className="text-left mt-5 border-seperate border-spacing-y-2">
          <EmployeeTableHeader />
          <EmployeeTableBody
            filteredEmployeesByFirstName={filteredEmployeesByFirstName}
            handleDeleteEmployee={handleDeleteEmployee}
          />
        </Table>
      </div>
      {renderModal()}
    </div>
  );
}

export default EmployeeOverview;
