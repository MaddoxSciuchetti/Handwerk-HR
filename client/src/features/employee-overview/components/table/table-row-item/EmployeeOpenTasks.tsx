import { Button } from '@/components/ui/button';
import { useEmployeeModal } from '@/features/employee-overview/hooks/useEmployeeModal';

type EmployeeOpenTasksProps = {
  employee: string;
  openTaskCountsByEmployee: number;
};

const EmployeeOpenTasks = ({
  employee,
  openTaskCountsByEmployee,
}: EmployeeOpenTasksProps) => {
  const { openEmployeeReminder: employeeCreate } = useEmployeeModal();

  return (
    <>
      <div className="flex items-center gap-3">
        <p>{openTaskCountsByEmployee} Offene Aufgaben</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="cursor-pointer pointer-events-none opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            employeeCreate(employee);
          }}
        >
          Ansehen
        </Button>
      </div>
    </>
  );
};

export default EmployeeOpenTasks;
