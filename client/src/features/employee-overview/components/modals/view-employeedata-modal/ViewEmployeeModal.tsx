import LoadingAlert from '@/components/alerts/LoadingAlert';
import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import { Button } from '@/components/ui/button';
import { EmployeeTabsData } from '@/features/employee-overview/components/employees/EmployeeTabsData';
import ReminderWindow from '@/features/employee-overview/components/modals/view-employeedata-modal/ReminderWindow';
import useEmployeeData from '@/features/employee-overview/hooks/useEmployeeData';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';

type ViewEmployeeModalProps = {
  selectedOwner: string;
};

const ViewEmployeeModal = ({ selectedOwner }: ViewEmployeeModalProps) => {
  const { isLoading, tasksByEmployee } = useEmployeeData();
  const [isReminderStep, setIsReminderStep] = useState(false);

  if (isLoading) return <LoadingAlert />;

  return (
    <SmallWrapper className="items-stretch justify-start overflow-hidden">
      <div className="flex h-full w-full min-h-0 flex-col p-6">
        <div className="mb-4 flex items-center gap-2">
          {isReminderStep && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsReminderStep(false)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Zurück zu Aufgaben"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="text-lg font-medium">
            {isReminderStep ? <p>Erinnerung senden</p> : <p>Aufgaben</p>}
          </h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {isReminderStep ? (
            <ReminderWindow onClose={() => setIsReminderStep(false)} />
          ) : (
            <EmployeeTabsData
              user={selectedOwner}
              tasksByEmployee={tasksByEmployee}
              onTaskClick={() => setIsReminderStep(true)}
            />
          )}
        </div>
      </div>
    </SmallWrapper>
  );
};

export default ViewEmployeeModal;
