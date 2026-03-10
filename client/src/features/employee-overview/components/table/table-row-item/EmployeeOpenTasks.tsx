import { useEmployeeModal } from '@/features/employee-overview/hooks/useEmployeeModal';

type EmployeeOpenTasksProps = {
  owner: string;
};

const EmployeeOpenTasks = ({ owner }: EmployeeOpenTasksProps) => {
  const { employeeCreate } = useEmployeeModal();

  return (
    <>
      <p
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          employeeCreate(owner);
        }}
      >
        Offene Aufgaben
      </p>
    </>
  );
};

export default EmployeeOpenTasks;
