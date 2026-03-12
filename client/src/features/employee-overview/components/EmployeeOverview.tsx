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
import ViewEmployeeModal from './modals/view-employeedata-modal/ViewEmployeeModal';
import EmployeeTableHeader from './table/EmployeeTableHeader';
import EmployeeTableBody from './table/TableBody';

function EmployeeOverview() {
  const { EmployeeData } = useGetEmployees();
  const { modalState, openCreate, closeModal } = useEmployeeModal();
  const { DeleteEmployee, isPending } = useDeleteEmployee();
  const [search, setSearch] = useState('');

  const filteredEmployees = EmployeeData?.filter((employee) =>
    employee.vorname.toLowerCase().includes(search.toLowerCase())
  );

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

      case 'employeecreate':
        return (
          <ModalOverlay handleToggle={closeModal}>
            <ViewEmployeeModal selectedOwner={modalState.owner} />
          </ModalOverlay>
        );
    }
  };

  if (isPending) return <LoadingAlert />;

  return (
    <div className="mx-auto flex h-full w-5xl flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl">
      <div className="h-full w-full flex flex-col">
        <SearchHeaderResuable
          search={search}
          setSearch={setSearch}
          toggleModal={openCreate}
          description=" Mitarbeiter Hinzufügen"
        />
        <Table className="text-left mt-5 border-seperate border-spacing-y-2">
          <EmployeeTableHeader />
          <EmployeeTableBody
            EmployeeData={filteredEmployees}
            DeleteEmployee={DeleteEmployee}
          />
        </Table>
      </div>
      {renderModal()}
    </div>
  );
}

export default EmployeeOverview;
