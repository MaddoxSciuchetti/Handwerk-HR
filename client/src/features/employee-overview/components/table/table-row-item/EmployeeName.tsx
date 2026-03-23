import { EmployeeDataObject } from '@/features/employee-overview/schemas/schema';

type EmployeeNameProps = {
  employee: EmployeeDataObject;
};

const EmployeeName = ({ employee }: EmployeeNameProps) => {
  return (
    <>
      {employee.user_permission === 'CHEF' ? (
        <p>
          <span className="text-(--status-info-foreground)">Ich:</span> {''}
          {employee.vorname} {employee.nachname}
        </p>
      ) : (
        <p>
          {employee.vorname}
          {employee.nachname}
        </p>
      )}
    </>
  );
};

export default EmployeeName;
