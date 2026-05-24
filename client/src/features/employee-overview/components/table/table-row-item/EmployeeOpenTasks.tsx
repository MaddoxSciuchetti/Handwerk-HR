type EmployeeOpenTasksProps = {
  openTaskCountsByEmployee: number;
};

const EmployeeOpenTasks = ({
  openTaskCountsByEmployee,
}: EmployeeOpenTasksProps) => {
  return (
    <div className="flex items-center gap-3">
      <p>{openTaskCountsByEmployee} </p>
    </div>
  );
};

export default EmployeeOpenTasks;
