import { TableBody } from '@/components/ui/table';
import { Dispatch, SetStateAction } from 'react';
import { UseMutateFunction } from '@tanstack/react-query';
import { user } from '@/lib/api';
import { TEmployeeResponse } from '../../schemas/schema';
import EmployeeName from './EmployeeName';
import EmployeeStatus from './EmployeeStatus';
import EmployeeSubstitute from './EmployeeSubstitute';
import EditDropdown from './EditDropdown';

type TableBodyProps = {
  EmployeeData: TEmployeeResponse;
  toggleEmployeeModal: () => void;
  setFirstName: Dispatch<SetStateAction<string>>;
  setLastName: Dispatch<SetStateAction<string>>;
  setIdValue: Dispatch<SetStateAction<string | undefined>>;
  DeleteEmployee: UseMutateFunction<user, Error, string, unknown>;
};

const EmployeeTableBody = ({
  EmployeeData,
  toggleEmployeeModal,
  setFirstName,
  setLastName,
  setIdValue,
  DeleteEmployee,
}: TableBodyProps) => {
  return (
    <>
      <TableBody>
        {EmployeeData?.map((value, index) => (
          <tr
            className="hover:bg-gray-50 rounded-2xl cursor-pointer border-seperate border-spacing-y-2 py-5"
            key={index}
            onClick={() => {
              toggleEmployeeModal();
              setFirstName(value.vorname);
              setLastName(value.nachname);
              setIdValue(value.id);
            }}
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
