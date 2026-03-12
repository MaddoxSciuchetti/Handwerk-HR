import { Button } from '@/components/ui/button';
import { useEmployeeModal } from '@/features/employee-overview/hooks/useEmployeeModal';

type EmployeeOpenTasksProps = {
  owner: string;
  openTaskCount: number;
};

const EmployeeOpenTasks = ({
  owner,
  openTaskCount,
}: EmployeeOpenTasksProps) => {
  const { employeeCreate } = useEmployeeModal();

  return (
    <>
      <div className="flex items-center gap-3">
        <p>{openTaskCount} Offene Aufgaben</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="cursor-pointer pointer-events-none opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            employeeCreate(owner);
          }}
        >
          Ansehen
        </Button>
      </div>
    </>
  );
};

export default EmployeeOpenTasks;
