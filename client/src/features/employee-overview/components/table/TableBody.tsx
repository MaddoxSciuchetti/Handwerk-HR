import { TableBody } from '@/components/ui/table';
import { UseMutateFunction } from '@tanstack/react-query';
import { useEmployeeModal } from '../../hooks/useEmployeeModal';
import { EmployeeDataArray } from '../../schemas/schema';

import DropDownResuable from '@/components/DropDownResuable';
import { User } from '@/features/user-profile/types/auth.type';
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
      <TableBody className="text-left mt-5">
        {EmployeeData?.map((value) => (
          <tr
            className="  cursor-pointer py-5"
            key={value.id}
            onClick={() =>
              openEdit(value.id, `${value.vorname}${value.nachname}`)
            }
          >
            <td className="text-sm font-semibold py-5 rounded-l-xl">
              <EmployeeName value={value} />
            </td>
            <td className="">
              <EmployeeStatus value={value} />
            </td>
            <td className="">
              <EmployeeSubstitute value={value} />
            </td>
            <td className="rounded-r-xl">
              <DropDownResuable
                description="Löschen"
                imgsrc="/assets/editReact.svg"
                disabled={value.user_permission === 'CHEF'}
                action={() => DeleteEmployee(value.id)}
              />
            </td>
          </tr>
        ))}
      </TableBody>
    </>
  );
};

export default EmployeeTableBody;
