import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import TrashButton from '@/components/TrashButton';
import { TableCell, TableRow } from '@/components/ui/table';
import { User } from '@/features/user-profile/types/auth.type';
import { UseMutateFunction } from '@tanstack/react-query';
import { useState } from 'react';
import { EmployeeDataArray } from '../../schemas/schema';
import EmployeeName from '../table/table-row-item/EmployeeName';
import EmployeeOpenTasks from '../table/table-row-item/EmployeeOpenTasks';
import EmployeeStatus from '../table/table-row-item/EmployeeStatus';
import EmployeeSubstitute from '../table/table-row-item/EmployeeSubstitute';

type EmployeeItemProps = {
  employee: EmployeeDataArray[number];
  openTaskCount: number;
  handleDeleteEmployee: UseMutateFunction<User, Error, string, unknown>;
  onSelectEmployee: (employee: EmployeeDataArray[number]) => void;
};

const EmployeeItem = ({
  employee,
  openTaskCount,
  handleDeleteEmployee,
  onSelectEmployee,
}: EmployeeItemProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const closeDeleteModalHandler = () => setIsDeleteModalOpen(false);

  return (
    <TableRow
      className="cursor-pointer hover:bg-transparent"
      onClick={() => onSelectEmployee(employee)}
    >
      <TableCell className="min-w-0 truncate whitespace-normal">
        <EmployeeName employee={employee} />
      </TableCell>
      <TableCell className="text-left tabular-nums">
        <EmployeeOpenTasks openTaskCountsByEmployee={openTaskCount} />
      </TableCell>
      <TableCell className="text-left whitespace-normal">
        <EmployeeStatus employee={employee} />
      </TableCell>
      <TableCell className="text-left whitespace-normal">
        <EmployeeSubstitute employee={employee} />
      </TableCell>
      <TableCell className="text-left" onClick={(e) => e.stopPropagation()}>
        <TrashButton
          disabled={
            employee.organizationMembers[0]?.membershipRole === 'admin'
          }
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
      </TableCell>
    </TableRow>
  );
};

export default EmployeeItem;
