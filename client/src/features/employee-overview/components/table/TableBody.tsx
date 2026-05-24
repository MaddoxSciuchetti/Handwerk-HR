import { TableBody } from '@/components/ui/table';
import { User } from '@/features/user-profile/types/auth.type';
import { UseMutateFunction } from '@tanstack/react-query';
import useEmployeeData from '../../hooks/useEmployeeData';
import { EmployeeDataArray } from '../../schemas/schema';
import { EmployeeRow } from './EmployeeTableRow';

type TableBodyProps = {
  filteredEmployeesByFirstName: EmployeeDataArray;
  handleDeleteEmployee: UseMutateFunction<User, Error, string, unknown>;
  onSelectEmployee: (employee: EmployeeDataArray[number]) => void;
};
const EmployeeTableBody = ({
  filteredEmployeesByFirstName,
  handleDeleteEmployee,
  onSelectEmployee,
}: TableBodyProps) => {
  const { openTaskCountsByEmployee } = useEmployeeData();

  return (
    <TableBody className="text-left mt-5">
      {filteredEmployeesByFirstName?.map((employee) => (
        <EmployeeRow
          key={employee.id}
          employee={employee}
          handleDeleteEmployee={handleDeleteEmployee}
          openTaskCountsByEmployee={openTaskCountsByEmployee}
          onSelectEmployee={onSelectEmployee}
        />
      ))}
    </TableBody>
  );
};

export default EmployeeTableBody;
