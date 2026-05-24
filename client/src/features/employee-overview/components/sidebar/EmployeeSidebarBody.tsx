import RadioSelect from '@/features/worker-lifecycle/components/lifycycle-modal-content/RadioSelect';
import { Dispatch, SetStateAction } from 'react';
import {
  EMPLOYEE_SIDEBAR_OPTIONS,
  EmployeeSidebarAction,
} from '../../consts/sidebar.consts';
import { EmployeeDataArray } from '../../schemas/schema';
import EmployeeAbsenceContent from './contents/EmployeeAbsenceContent';
import EmployeeInfoContent from './contents/EmployeeInfoContent';
import EmployeeTasksContent from './contents/EmployeeTasksContent';

type EmployeeSidebarBodyProps = {
  employee: EmployeeDataArray[number];
  selectedAction: EmployeeSidebarAction | null;
  setSelectedAction: Dispatch<SetStateAction<EmployeeSidebarAction | null>>;
  onClose: () => void;
};

const EmployeeSidebarBody = ({
  employee,
  selectedAction,
  setSelectedAction,
  onClose,
}: EmployeeSidebarBodyProps) => {
  if (selectedAction === null) {
    return (
      <RadioSelect
        selectedOption={selectedAction}
        setSelectedOption={setSelectedAction}
        options={EMPLOYEE_SIDEBAR_OPTIONS}
      />
    );
  }

  if (selectedAction === 'info') {
    return <EmployeeInfoContent employeeId={employee.id} />;
  }

  if (selectedAction === 'absence') {
    return (
      <EmployeeAbsenceContent
        employeeId={employee.id}
        fullname={`${employee.firstName} ${employee.lastName}`}
        onComplete={onClose}
      />
    );
  }

  return <EmployeeTasksContent employeeId={employee.id} />;
};

export default EmployeeSidebarBody;
