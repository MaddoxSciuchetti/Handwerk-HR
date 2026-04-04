import { OrgUsersObject } from '@/features/employee-overview/schemas/schema';
import {
  calculateData,
  dateObject,
} from '@/features/employee-overview/utils/calculateDate.utils';

type SubstituteProps = {
  employee: OrgUsersObject;
};

const EmployeeSubstitute = ({ employee }: SubstituteProps) => {
  return (
    <>
      {(employee.employeeStatus?.length ?? 0) > 0 ? (
        employee.employeeStatus?.map((status, index) => (
          <div className="flex gap-1 " key={index}>
            {calculateData(
              new Date(status.absencebegin || ''),
              new Date(status.absenceEnd || ''),
              dateObject
            ) ? (
              <div>
                <span>{status.sub_user?.vorname}</span>{' '}
                <span>{status.sub_user?.nachname}</span>
              </div>
            ) : (
              <span>n/a</span>
            )}
          </div>
        ))
      ) : (
        <span>n/a</span>
      )}
    </>
  );
};

export default EmployeeSubstitute;
