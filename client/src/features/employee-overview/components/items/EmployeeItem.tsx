import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import TrashButton from '@/components/TrashButton';
import {
  Cell,
  CellHolder,
  GrowingItem,
  Items,
} from '@/features/settings/components/Table';
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
      className="cursor-pointer"
      onClick={() => onSelectEmployee(employee)}
    >
      <GrowingItem className="pl-7 py-0">
        <EmployeeName employee={employee} />
      </GrowingItem>
      <CellHolder>
        <Cell>
          <EmployeeOpenTasks openTaskCountsByEmployee={openTaskCount} />
        </Cell>
        <Cell>
          <EmployeeStatus employee={employee} />
        </Cell>
        <Cell>
          <EmployeeSubstitute employee={employee} />
        </Cell>
        <Cell>
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
      </CellHolder>
    </Items>
  );
};

export default EmployeeItem;
