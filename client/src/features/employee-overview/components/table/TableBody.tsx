import { TableBody } from '@/components/ui/table';
import { UseMutateFunction } from '@tanstack/react-query';
import useEmployeeData from '../../hooks/useEmployeeData';
import { useEmployeeModal } from '../../hooks/useEmployeeModal';
import { EmployeeDataArray } from '../../schemas/schema';

import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import TrashButton from '@/components/TrashButton';
import { Button } from '@/components/ui/button';
import { User } from '@/features/user-profile/types/auth.type';
import { useState } from 'react';
import EmployeeName from './table-row-item/EmployeeName';
import EmployeeOpenTasks from './table-row-item/EmployeeOpenTasks';
import EmployeeStatus from './table-row-item/EmployeeStatus';
import EmployeeSubstitute from './table-row-item/EmployeeSubstitute';

type TableBodyProps = {
  filteredEmployeesByFirstName: EmployeeDataArray;
  handleDeleteEmployee: UseMutateFunction<User, Error, string, unknown>;
};

const EmployeeTableBody = ({
  filteredEmployeesByFirstName,
  handleDeleteEmployee,
}: TableBodyProps) => {
  const { openEditEmployee } = useEmployeeModal();
  const { openTaskCountsByEmployee } = useEmployeeData();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const closeDeleteModalHandler = () => setIsDeleteModalOpen(false);

  return (
    <>
      <TableBody className="text-left mt-5">
        {filteredEmployeesByFirstName?.map((employee) => {
          return (
            <tr className="group py-5 transition-colors" key={employee.id}>
              <td className="text-sm font-semibold py-5 rounded-l-xl">
                <div className="flex items-center gap-3">
                  <EmployeeName employee={employee} />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="cursor-pointer pointer-events-none opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditEmployee(
                        employee.id,
                        `${employee.vorname}${employee.nachname}`
                      );
                    }}
                  >
                    Abwesenheit eintragen
                  </Button>
                </div>
              </td>
              <td>
                <EmployeeOpenTasks
                  employee={employee.id}
                  openTaskCountsByEmployee={
                    openTaskCountsByEmployee.get(employee.id) ?? 0
                  }
                />
              </td>
              <td className="">
                <EmployeeStatus employee={employee} />
              </td>
              <td className="">
                <EmployeeSubstitute employee={employee} />
              </td>
              <td className="rounded-r-xl">
                <TrashButton
                  disabled={employee.user_permission === 'CHEF'}
                  description={'Löschen'}
                  onClick={() => setIsDeleteModalOpen(true)}
                />
                <DeleteConfirmModal
                  isOpen={isDeleteModalOpen}
                  onCancel={closeDeleteModalHandler}
                  onConfirm={() => {
                    handleDeleteEmployee(employee.id);
                    closeDeleteModalHandler();
                  }}
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
