import { TableBody } from '@/components/ui/table';
import { UseMutateFunction } from '@tanstack/react-query';
import { user } from '@/lib/api';
import { TEmployeeResponse } from '../../schemas/schema';
import EmployeeName from './EmployeeName';
import EmployeeStatus from './EmployeeStatus';
import EmployeeSubstitute from './EmployeeSubstitute';
import EditDropdown from './EditDropdown';
import { useEmployeeModal } from '../../hooks/use-employeeModal';

type TableBodyProps = {
  EmployeeData: TEmployeeResponse;
  DeleteEmployee: UseMutateFunction<user, Error, string, unknown>;
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
