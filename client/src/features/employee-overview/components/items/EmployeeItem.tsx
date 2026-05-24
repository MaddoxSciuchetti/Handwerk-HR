import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import TrashButton from '@/components/TrashButton';
import {
  Cell,
  employeeTableGridClassName,
  Items,
} from '@/features/settings/components/Table';
import { cn } from '@/lib/utils';
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
    <Items
      state="hover"
      className={cn('w-full cursor-pointer', employeeTableGridClassName)}
      onClick={() => onSelectEmployee(employee)}
    >
      <div className="min-w-0 pl-7">
        <EmployeeName employee={employee} />
      </div>
      <Cell className="text-left">
        <EmployeeOpenTasks openTaskCountsByEmployee={openTaskCount} />
      </Cell>
      <Cell className="text-left">
        <EmployeeStatus employee={employee} />
      </Cell>
      <Cell className="text-left">
        <EmployeeSubstitute employee={employee} />
      </Cell>
      <Cell className="text-left">
        <div onClick={(e) => e.stopPropagation()}>
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
        </div>
      </Cell>
    </Items>
  );
};

export default EmployeeItem;
