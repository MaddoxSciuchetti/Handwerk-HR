import { useMemo } from 'react';
import { TEmployForm } from '../types/employeeform.type';

function useEmployeeGroups(
  user: string,
  cleanData: Array<[string, TEmployForm]>
) {
  const employeeGroups = useMemo(() => {
    return cleanData
      .filter(([owner]) => owner === user)
      .map(([owner, items]) => {
        const flatInputs = items.flatMap((task) =>
          task.inputs.map((input) => ({
            description: task.description,
            timestamp: input.timestamp,
            timeStampLastChange: input.timeStampLastChange,
            form_field_id: task.form_field_id,
            status: input.status,
            employee: input.employee,
          }))
        );

        const firstEmployee = flatInputs[0]?.employee;

        return [
          owner,
          {
            employee: firstEmployee ?? {
              vorname: owner,
              nachname: '',
              email: null,
            },
            inputs: flatInputs.map(({ employee, ...rest }) => rest),
          },
        ] as const;
      })
      .filter(([, group]) => group.inputs.length > 0);
  }, [cleanData, user]);

  return {
    employeeGroups,
  };
}

export default useEmployeeGroups;
