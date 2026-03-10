import { TableBody } from '@/components/ui/table';
import { UseMutateFunction } from '@tanstack/react-query';
import { useMemo } from 'react';
import useEmployeeData from '../../hooks/useEmployeeData';
import { useEmployeeModal } from '../../hooks/useEmployeeModal';
import { EmployeeDataArray } from '../../schemas/schema';

import DropDownResuable from '@/components/DropDownResuable';
import { Button } from '@/components/ui/button';
import { User } from '@/features/user-profile/types/auth.type';
import EmployeeName from './table-row-item/EmployeeName';
import EmployeeOpenTasks from './table-row-item/EmployeeOpenTasks';
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
  const { cleanData } = useEmployeeData();

  const openTaskCountsByOwner = useMemo(() => {
    return new Map(
      cleanData.map(([owner, items]) => {
        const totalOpenTasks = items.reduce(
          (count, item) => count + item.inputs.length,
          0
        );
        return [owner, totalOpenTasks] as const;
      })
    );
  }, [cleanData]);

  return (
    <>
      <TableBody className="text-left mt-5">
        {EmployeeData?.map((value) => {
          return (
            <tr className="group py-5" key={value.id}>
              <td className="text-sm font-semibold py-5 rounded-l-xl">
                <div className="flex items-center gap-3">
                  <EmployeeName value={value} />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="cursor-pointer pointer-events-none opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(value.id, `${value.vorname}${value.nachname}`);
                    }}
                  >
                    Abwesenheit eintragen
                  </Button>
                </div>
              </td>
              <td>
                <EmployeeOpenTasks
                  owner={value.id}
                  openTaskCount={openTaskCountsByOwner.get(value.id) ?? 0}
                />
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
          );
        })}
      </TableBody>
    </>
  );
};

export default EmployeeTableBody;
