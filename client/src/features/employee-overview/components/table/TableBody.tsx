import { TableBody } from '@/components/ui/table';
import { UseMutateFunction } from '@tanstack/react-query';
import { useEmployeeModal } from '../../hooks/use-employeeModal';
import { EmployeeDataArray } from '../../schemas/schema';

import { User } from '@/features/user-profile/types/auth.type';
import EditDropdown from './table-row-item/EditDropdown';
import EmployeeName from './table-row-item/EmployeeName';
import EmployeeStatus from './table-row-item/EmployeeStatus';
import EmployeeSubstitute from './table-row-item/EmployeeSubstitute';

type TableBodyProps = {
  EmployeeData: EmployeeDataArray;
  DeleteEmployee: UseMutateFunction<User, Error, string, unknown>;
};

const EmployeeTableBody = ({
  EmployeeData,
  DeleteEmployee,
}: TableBodyProps) => {
  const { openEdit } = useEmployeeModal();
  return (
    <>
      <TableBody>
        {EmployeeData?.map((value) => (
          <tr
            className="hover:bg-gray-50 rounded-2xl cursor-pointer border-seperate border-spacing-y-2 py-5"
            key={value.id}
            onClick={() =>
              openEdit(value.id, `${value.vorname}${value.nachname}`)
            }
          >
            <td className="text-sm font-semibold py-5">
              <EmployeeName value={value} />
            </td>
            <td>
              <EmployeeStatus value={value} />
            </td>
            <td>
              <EmployeeSubstitute value={value} />
            </td>
            <td>
              <EditDropdown value={value} DeleteEmployee={DeleteEmployee} />
            </td>
          </tr>
        ))}
      </TableBody>
    </>
  );
};

export default EmployeeTableBody;
