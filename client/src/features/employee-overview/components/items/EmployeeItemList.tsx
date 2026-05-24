import { User } from '@/features/user-profile/types/auth.type';
import { UseMutateFunction } from '@tanstack/react-query';
import useEmployeeData from '../../hooks/useEmployeeData';
import { EmployeeDataArray } from '../../schemas/schema';
import EmployeeItem from './EmployeeItem';

type EmployeeItemListProps = {
  employees: EmployeeDataArray;
  handleDeleteEmployee: UseMutateFunction<User, Error, string, unknown>;
  onSelectEmployee: (employee: EmployeeDataArray[number]) => void;
};

const EmployeeItemList = ({
  employees,
  handleDeleteEmployee,
  onSelectEmployee,
}: EmployeeItemListProps) => {
  const { openTaskCountsByEmployee } = useEmployeeData();

  return (
    <>
      {employees.map((employee) => (
        <EmployeeItem
          key={employee.id}
          employee={employee}
          openTaskCount={openTaskCountsByEmployee.get(employee.id) ?? 0}
          handleDeleteEmployee={handleDeleteEmployee}
          onSelectEmployee={onSelectEmployee}
        />
      ))}
    </>
  );
};

export default EmployeeItemList;
