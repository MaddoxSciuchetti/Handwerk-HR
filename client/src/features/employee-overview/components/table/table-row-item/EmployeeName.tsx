import { EmployeeDataObject } from '@/features/employee-overview/schemas/schema';

type EmployeeNameProps = {
  employee: EmployeeDataObject;
};

const EmployeeName = ({ employee }: EmployeeNameProps) => {
  const isOwner = employee.organizationMembers[0]?.role.name === 'Owner';

  return (
    <>
      {isOwner ? (
        <p>
          <span className="text-(--status-info-foreground)">Ich:</span> {''}
          {employee.firstName} {employee.lastName}
        </p>
      ) : (
        <p>
          {employee.firstName} {employee.lastName}
        </p>
      )}
    </>
  );
};

export default EmployeeName;
