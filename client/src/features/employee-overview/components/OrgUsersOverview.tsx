import { Table } from '@/components/ui/table';
import useDeleteEmployee from '../hooks/useDeleteEmployee';
import useGetOrgUsers from '../hooks/useGetEmployees';

import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { useState } from 'react';
import { useOrgUsersModal } from '../hooks/useOrgUsersModal';
import EmployeeSearchHeader from './EmployeeSearchHeader';
import EditOrgUser from './modals/edit-employee-modal/EmployeeModal';
import UserInfo from './modals/employee-info-modal/EmployeeInfoModal';
import ViewEmployeeModal from './modals/view-employeedata-modal/ViewEmployeeModal';
import EmployeeTableHeader from './table/EmployeeTableHeader';
import EmployeeTableBody from './table/TableBody';

function OrgUsersOverview() {
  const { OrgUsers, isLoading } = useGetOrgUsers();
  const { modalState, closeEmployee } = useOrgUsersModal();
  const { handleDeleteEmployee, isPending } = useDeleteEmployee();
  const [search, setSearch] = useState('');

  const OrgUsersByFirstName = (OrgUsers ?? []).filter((user) =>
    user.firstName.toLowerCase().includes(search.toLowerCase())
  );

  const renderModal = () => {
    switch (modalState.kind) {
      case 'edit':
        return (
          <ModalOverlay handleToggle={closeEmployee}>
            <EditOrgUser
              fullname={modalState.fullname}
              id={modalState.employeeId}
              toggleEmployeeModal={closeEmployee}
            />
          </ModalOverlay>
        );

      case 'info':
        return (
          <ModalOverlay handleToggle={closeEmployee}>
            <UserInfo employeeId={modalState.employeeId} />
          </ModalOverlay>
        );

      case 'view':
        return (
          <ModalOverlay handleToggle={closeEmployee}>
            <ViewEmployeeModal selectedOwner={modalState.selectedOwner} />
          </ModalOverlay>
        );
    }
  };

  if (isLoading || isPending) return <LoadingAlert />;

  return (
    <div className="mx-auto flex h-full w-5xl flex-col overflow-auto rounded-2xl bg-card  w-full">
      <div className="h-full w-full flex flex-col">
      <h2 className="text-lg font-semibold text-foreground mb-2">
        Aktuelle Mitarbeiter
      </h2>
        <EmployeeSearchHeader search={search} setSearch={setSearch} />
        <Table className="text-left mt-5 border-seperate border-spacing-y-2">
          <EmployeeTableHeader />
          <EmployeeTableBody
            filteredEmployeesByFirstName={OrgUsersByFirstName}
            handleDeleteEmployee={handleDeleteEmployee}
          />
        </Table>
      </div>
      {renderModal()}
    </div>
  );
}

export default OrgUsersOverview;
