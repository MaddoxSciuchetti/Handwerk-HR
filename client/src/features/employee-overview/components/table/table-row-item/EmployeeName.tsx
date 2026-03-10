import { EmployeeDataObject } from '@/features/employee-overview/schemas/schema';

type EmployeeNameProps = {
  value: EmployeeDataObject;
};

const EmployeeName = ({ value }: EmployeeNameProps) => {
  return (
    <>
      {value.user_permission === 'CHEF' ? (
        <p>
          <span className="text-(--status-info-foreground)">Ich:</span> {''}
          {value.vorname} {value.nachname}
        </p>
      ) : (
        <p>
          {value.vorname}
          {value.nachname}
        </p>
      )}
    </>
  );
};

export default EmployeeName;
