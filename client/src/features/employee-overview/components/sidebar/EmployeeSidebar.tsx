import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';
import SidebarContent from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarContent';
import SidebarHeader from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarHeader';
import { SidebarPanel } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarPanel';
import { ChevronLeft, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  EMPLOYEE_SIDEBAR_TITLES,
  EmployeeSidebarAction,
} from '../../consts/sidebar.consts';
import { EmployeeDataArray } from '../../schemas/schema';
import EmployeeSidebarBody from './EmployeeSidebarBody';

type EmployeeSidebarProps = {
  employee: EmployeeDataArray[number] | null;
  isOpen: boolean;
  onClose: () => void;
};

const EmployeeSidebar = ({
  employee,
  isOpen,
  onClose,
}: EmployeeSidebarProps) => {
  const [selectedAction, setSelectedAction] =
    useState<EmployeeSidebarAction | null>(null);

  useEffect(() => {
    if (!isOpen) setSelectedAction(null);
  }, [isOpen, employee?.id]);

  const headerLabel = selectedAction
    ? EMPLOYEE_SIDEBAR_TITLES[selectedAction]
    : employee
      ? `${employee.firstName} ${employee.lastName}`
      : 'Mitarbeiter';

  return (
    <SidebarAside className="p-2" isOpen={isOpen}>
      <SidebarPanel className="w-full">
        <SidebarHeader className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2">
            {selectedAction && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                aria-label="Zurück"
                onClick={() => setSelectedAction(null)}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Button>
            )}
            <Label className="typo-body-lg font-bold">{headerLabel}</Label>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            aria-label="Schließen"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </SidebarHeader>
        <SidebarContent className="mt-2 flex flex-col gap-4 p-6">
          {employee && (
            <EmployeeSidebarBody
              employee={employee}
              selectedAction={selectedAction}
              setSelectedAction={setSelectedAction}
              onClose={onClose}
            />
          )}
        </SidebarContent>
      </SidebarPanel>
    </SidebarAside>
  );
};

export default EmployeeSidebar;
