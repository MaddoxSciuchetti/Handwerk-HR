import { EmployeeDataObject } from '@/features/employee-overview/schemas/schema';

type EmployeeNameProps = {
  value: EmployeeDataObject;
};

const EmployeeName = ({ value }: EmployeeNameProps) => {
  return (
    <>
      {value.user_permission === 'CHEF' ? (
        <p>
          <span className="text-blue-400">Ich:</span> {''}
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
