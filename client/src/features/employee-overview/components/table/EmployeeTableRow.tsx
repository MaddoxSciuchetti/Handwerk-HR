import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import TrashButton from '@/components/TrashButton';
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
  onSelectEmployee: (employee: EmployeeDataArray[number]) => void;
};

export const EmployeeRow = ({
  employee,
  handleDeleteEmployee,
  openTaskCountsByEmployee,
  onSelectEmployee,
}: EmployeeRowProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const closeDeleteModalHandler = () => setIsDeleteModalOpen(false);

  return (
    <tr
      className="group cursor-pointer py-5 transition-colors hover:bg-accent/40"
      onClick={() => onSelectEmployee(employee)}
    >
      <td className="text-sm font-semibold py-5 rounded-l-xl">
        <div className="flex items-center gap-3">
          <EmployeeName employee={employee} />
        </div>
      </td>
      <td>
        <EmployeeOpenTasks
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
      <td className="rounded-r-xl" onClick={(e) => e.stopPropagation()}>
        <TrashButton
          disabled={employee.organizationMembers[0]?.membershipRole === 'admin'}
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
