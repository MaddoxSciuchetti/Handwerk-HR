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
        <div className="flex w-full flex-col gap-2 pt-1">
          {group.inputs.map((task) => (
            <div
              key={`${task.form_field_id}-${task.timestamp.toISOString()}`}
              className="cursor-pointer rounded-lg px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={onTaskClick}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="flex-1 text-sm font-medium">{task.description}</p>
                <p className="text-xs text-muted-foreground">
                  {task.timeStampLastChange.toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default DataContent;
