import { EmployeeDataObject } from '@/features/employee-overview/schemas/schema';
import {
  calculateData,
  dateObject,
} from '@/features/employee-overview/utils/calculateDate.utils';

type EmployeeStatusProps = {
  employee: EmployeeDataObject;
};

const EmployeeStatus = ({ employee }: EmployeeStatusProps) => {
  return (
    <>
      {employee.absences.length > 0 ? (
        employee.absences.map((status) => (
          <div className="flex flex-col" key={status.id}>
            {calculateData(
              new Date(status.startDate || ''),
              new Date(status.endDate || ''),
              dateObject
            ) && status.substitute ? (
              <>
                <p className="w-full text-sm text-(--chart-5)">Abwesend vom</p>
                <div className="flex gap-1 text-sm">
                  {status.startDate?.toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                  })}
                  <p>bis</p>
                  {status.endDate?.toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                  })}
                </div>
              </>
            ) : (
              <p className="w-full text-sm text-(--chart-2)">Anwesend</p>
            )}
          </div>
        ))
      ) : (
        <div className="flex flex-col" key={`preent-${employee.id}`}>
          <p className="w-full text-sm text-(--chart-2)">Anwesend</p>
        </div>
      )}
    </>
  );
};

export default EmployeeStatus;
