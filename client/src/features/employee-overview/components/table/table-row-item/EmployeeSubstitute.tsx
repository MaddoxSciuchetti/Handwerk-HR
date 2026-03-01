import { TEmployee } from '../../schemas/schema';
import { calculateData, dateObject } from '../../utils/calculateDate.utils';

type SubstituteProps = {
  value: TEmployee;
};

const EmployeeSubstitute = ({ value }: SubstituteProps) => {
  return (
    <>
      {(value.employeeStatus?.length ?? 0) > 0 ? (
        value.employeeStatus?.map((value, index) => (
          <div className="flex gap-1 " key={index}>
            {calculateData(
              new Date(value.absencebegin || ''),
              new Date(value.absenceEnd || ''),
              dateObject
            ) ? (
              <div>
                <span>{value.sub_user?.vorname}</span>{' '}
                <span>{value.sub_user?.nachname}</span>
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
