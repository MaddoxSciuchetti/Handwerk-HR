import { EmployeeDataObject } from '@/features/employee-overview/schemas/schema';

type EmployeeNameProps = {
  employee: EmployeeDataObject;
};

const EmployeeName = ({ employee }: EmployeeNameProps) => {
  const isAdmin = employee.organizationMembers[0]?.membershipRole === 'admin';

  return (
    <>
      {isAdmin ? (
        <p className="truncate">
          <span className="text-(--status-info-foreground)">Ich:</span>{' '}
          {employee.firstName} {employee.lastName}
        </p>
      ) : (
        <p className="truncate">
          {employee.firstName} {employee.lastName}
        </p>
      )}
    </>
  );
};

export default EmployeeName;
