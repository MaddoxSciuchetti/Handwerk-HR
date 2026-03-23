import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import TrashButton from '@/components/TrashButton';
import { Button } from '@/components/ui/button';
import { User } from '@/features/user-profile/types/auth.type';
import { UseMutateFunction } from '@tanstack/react-query';
import { useState } from 'react';
import { EmployeeDataArray } from '../../schemas/schema';
import EmployeeName from './table-row-item/EmployeeName';
import EmployeeOpenTasks from './table-row-item/EmployeeOpenTasks';
import EmployeeStatus from './table-row-item/EmployeeStatus';
import EmployeeSubstitute from './table-row-item/EmployeeSubstitute';

type EmployeeRowProps = {
  employee: EmployeeDataArray[number];
  handleDeleteEmployee: UseMutateFunction<User, Error, string, unknown>;
  openTaskCountsByEmployee: Map<string, number>;
  openEditEmployee: (id: string, name: string) => void;
};

export const EmployeeRow = ({
  employee,
  handleDeleteEmployee,
  openTaskCountsByEmployee,
  openEditEmployee,
}: EmployeeRowProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const closeDeleteModalHandler = () => setIsDeleteModalOpen(false);

  return (
    <tr className="group py-5 transition-colors">
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
};
