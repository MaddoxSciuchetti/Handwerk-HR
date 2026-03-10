import { EmployeeGroup } from '@/features/employee-overview/types/employeeData.types';

export type DataContentProps = {
  group: EmployeeGroup;
  onTaskClick: () => void;
};
function DataContent({ group, onTaskClick }: DataContentProps) {
  return (
    <>
      {group.inputs.length === 0 ? (
        <p>Nutzer hat keine Offenen Aufgaben</p>
      ) : (
        <div className="flex flex-col gap-5 w-full">
          {group.inputs.map((task, taskIndex) => (
            <div
              key={taskIndex}
              className="mb-2 cursor-pointer rounded-2xl p-2 transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={onTaskClick}
            >
              <p>
                <strong>Aufabe:</strong>
                {task.description}
              </p>
              <p>
                <strong>Zuletzt bearbeitet:</strong>{' '}
                {task.timeStampLastChange.toLocaleDateString()}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                {task.status === 'null' ? 'Nicht angefangen' : task.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default DataContent;
