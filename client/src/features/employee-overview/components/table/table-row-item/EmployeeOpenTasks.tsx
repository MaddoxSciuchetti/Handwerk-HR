type EmployeeOpenTasksProps = {
  openTaskCountsByEmployee: number;
};

const EmployeeOpenTasks = ({
  openTaskCountsByEmployee,
}: EmployeeOpenTasksProps) => {
  return <p>{openTaskCountsByEmployee} Offene Aufgaben</p>;
};

export default EmployeeOpenTasks;
