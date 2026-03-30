import { OrgUsersObject } from '@/features/employee-overview/schemas/schema';

type EmployeeNameProps = {
  employee: OrgUsersObject;
};

const EmployeeName = ({ employee }: EmployeeNameProps) => {
  return (
    <>
      <p>
        {employee.firstName}
        {employee.lastName}
      </p>
    </>
  );
};

export default EmployeeName;
