import { Table } from '@/components/ui/table';
import useDeleteEmployee from '../hooks/useDeleteEmployee';
import useGetOrgUsers from '../hooks/useGetEmployees';

import LoadingAlert from '@/components/alerts/LoadingAlert';
import SearchHeaderResuable from '@/components/layout/headers/SearchHeaderResuable';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { useState } from 'react';
import { useOrgUsersModal } from '../hooks/useOrgUsersModal';
import EditOrgUser from './modals/edit-employee-modal/EmployeeModal';
import UserInfo from './modals/employee-info-modal/EmployeeInfoModal';
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
    }
  };

  if (isLoading || isPending) return <LoadingAlert />;

  return (
    <div className="mx-auto flex h-full w-5xl flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl">
      <div className="h-full w-full flex flex-col">
        <SearchHeaderResuable search={search} setSearch={setSearch} />
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
