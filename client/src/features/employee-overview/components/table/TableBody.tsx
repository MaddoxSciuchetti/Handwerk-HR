import { TableBody } from '@/components/ui/table';
import { User } from '@/features/user-profile/types/auth.type';
import { UseMutateFunction } from '@tanstack/react-query';
import useEmployeeData from '../../hooks/useEmployeeData';
import { useOrgUsersModal } from '../../hooks/useOrgUsersModal';
import { OrgUsersArray } from '../../schemas/schema';
import { EmployeeRow } from './EmployeeTableRow';

type TableBodyProps = {
  filteredEmployeesByFirstName: OrgUsersArray;
  handleDeleteEmployee: UseMutateFunction<User, Error, string, unknown>;
};
const EmployeeTableBody = ({
  filteredEmployeesByFirstName,
  handleDeleteEmployee,
}: TableBodyProps) => {
  const { openEditEmployee } = useOrgUsersModal();
  const { openTaskCountsByEmployee } = useEmployeeData();

  return (
    <>
      <TableBody className="text-left mt-5">
        {filteredEmployeesByFirstName?.map((employee) => (
          <EmployeeRow
            key={employee.id}
            employee={employee}
            handleDeleteEmployee={handleDeleteEmployee}
            openTaskCountsByEmployee={openTaskCountsByEmployee}
            openEditEmployee={openEditEmployee}
          />
        ))}
      </TableBody>
    </>
  );
};

export default EmployeeTableBody;
