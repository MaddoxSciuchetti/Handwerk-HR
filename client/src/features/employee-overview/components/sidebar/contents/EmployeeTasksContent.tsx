import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { EmployeeTabsData } from '@/features/employee-overview/components/employees/EmployeeTabsData';
import ReminderWindow from '@/features/employee-overview/components/modals/view-employeedata-modal/ReminderWindow';
import useEmployeeData from '@/features/employee-overview/hooks/useEmployeeData';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';

type EmployeeTasksContentProps = {
  employeeId: string;
};

const EmployeeTasksContent = ({ employeeId }: EmployeeTasksContentProps) => {
  const { isLoading, tasksByEmployee } = useEmployeeData();
  const [isReminderStep, setIsReminderStep] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-40 w-full items-center justify-center">
        <LoadingAlert className="min-h-0" />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      {isReminderStep && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsReminderStep(false)}
          className="mb-3 h-7 w-7 self-start text-muted-foreground hover:text-foreground"
          aria-label="Zurück zu Aufgaben"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      {isReminderStep ? (
        <ReminderWindow onClose={() => setIsReminderStep(false)} />
      ) : (
        <EmployeeTabsData
          user={employeeId}
          tasksByEmployee={tasksByEmployee}
          onTaskClick={() => setIsReminderStep(true)}
        />
      )}
    </div>
  );
};

export default EmployeeTasksContent;
