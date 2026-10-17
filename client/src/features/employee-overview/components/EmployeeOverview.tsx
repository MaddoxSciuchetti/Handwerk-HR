import { Table } from '@/components/ui/table';
import useDeleteEmployee from '../hooks/useDeleteEmployee';
import useGetEmployees from '../hooks/useGetEmployees';

import LoadingAlert from '@/components/alerts/LoadingAlert';
import SearchHeaderResuable from '@/components/layout/headers/SearchHeaderResuable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useState } from 'react';
import { useEmployeeModal } from '../hooks/useEmployeeModal';
import { EmployeeDataArray } from '../schemas/schema';
import ModalMitarbeiter from './modals/create-employee-modal/EmployeeModal';
import ModalEditMitarbeiter from './modals/edit-employee-modal/EmployeeModal';
import EmployeeInfoModal from './modals/employee-info-modal/EmployeeInfoModal';
import ViewEmployeeModal from './modals/view-employeedata-modal/ViewEmployeeModal';
import EmployeeSidebar from './sidebar/EmployeeSidebar';
import EmployeeTableHeader from './table/EmployeeTableHeader';
import EmployeeTableBody from './table/TableBody';

function EmployeeOverview() {
  const { EmployeeData, isLoading } = useGetEmployees();
  const { modalState, openCreateEmployee, closeEmployee } = useEmployeeModal();
  const { handleDeleteEmployee, isPending } = useDeleteEmployee();
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<
    EmployeeDataArray[number] | null
  >(null);

  const filteredEmployeesByFirstName = (EmployeeData ?? []).filter((employee) =>
    employee.firstName.toLowerCase().includes(search.toLowerCase())
  );

  const renderModal = () => {
    switch (modalState.kind) {
      case 'edit':
        return (
          <Dialog open onOpenChange={(next) => { if (!next) closeEmployee(); }}>
            <DialogContent className="flex h-120 flex-col items-stretch justify-start overflow-hidden">
            <ModalEditMitarbeiter
              fullname={modalState.fullname}
              id={modalState.employeeId}
              toggleEmployeeModal={closeEmployee}
            />
            </DialogContent>
          </Dialog>
        );
      case 'create':
        return (
          <Dialog open onOpenChange={(next) => { if (!next) closeEmployee(); }}>
            <DialogContent className="flex h-120 flex-col items-stretch justify-start overflow-hidden">
            <ModalMitarbeiter toggleModal={closeEmployee} />
            </DialogContent>
          </Dialog>
        );

      case 'employeecreate':
        return (
          <Dialog open onOpenChange={(next) => { if (!next) closeEmployee(); }}>
            <DialogContent className="flex h-120 flex-col items-stretch justify-start overflow-hidden">
            <ViewEmployeeModal selectedOwner={modalState.owner} />
            </DialogContent>
          </Dialog>
        );

      case 'employeeinfo':
        return (
          <Dialog open onOpenChange={(next) => { if (!next) closeEmployee(); }}>
            <DialogContent className="h-auto min-h-80 rounded-lg p-4 text-center sm:max-w-2xl">
            <EmployeeInfoModal employeeId={modalState.employeeId} />
            </DialogContent>
          </Dialog>
        );
    }
  };

  if (isLoading || isPending) return <LoadingAlert />;

  return (
    <div className="mx-auto flex h-full w-5xl flex-col overflow-auto rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
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
            onSelectEmployee={setSelectedEmployee}
          />
        </Table>
      </div>
      <EmployeeSidebar
        employee={selectedEmployee}
        isOpen={selectedEmployee !== null}
        onClose={() => setSelectedEmployee(null)}
      />
      {renderModal()}
    </div>
  );
}

export default EmployeeOverview;
