import { EmployeeDataObject } from '@/features/employee-overview/schemas/schema';
import {
  calculateData,
  dateObject,
} from '@/features/employee-overview/utils/calculateDate.utils';

type SubstituteProps = {
  employee: EmployeeDataObject;
};

const EmployeeSubstitute = ({ employee }: SubstituteProps) => {
  return (
    <>
      {employee.absences.length > 0 ? (
        employee.absences.map((status, index) => (
          <div className="flex gap-1 " key={index}>
            {calculateData(
              new Date(status.startDate || ''),
              new Date(status.endDate || ''),
              dateObject
            ) ? (
              <div>
                <span>{status.substitute?.firstName}</span>{' '}
                <span>{status.substitute?.lastName}</span>
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
